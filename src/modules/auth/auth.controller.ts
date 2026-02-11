import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";
import User from "../user/user.model";
import otpGenerator from "../../utils/otpGenerator";
import { sendOTPEmail } from "../../utils/sendOtpEmail";
import logger from "../../utils/logger";
import { emailRegisterSchema, otpVerifySchema } from "./auth.validation";
import { firebaseAdmin } from "../../config/firebaseAdmin.config";

export const signUp = catchAsync(async (req: Request, res: Response) => {
    // 1️⃣ Validate request body
    const parsed = emailRegisterSchema.safeParse(req.body);

    if (!parsed.success) {
        return sendResponse(res, status.BAD_REQUEST, "Invalid input", parsed.error.format());
    }

    const { name, email, password, role = "user" } = parsed.data;

    // 2️⃣ Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return sendResponse(res, status.BAD_REQUEST, "Email already registered");
    }

    // 3️⃣ If registering as admin, check if an admin already exists
    if (role === "admin") {
        const existingAdmin = await User.findOne({ role: "admin" });
        if (existingAdmin) {
            return sendResponse(res, status.BAD_REQUEST, "Admin already registered");
        }
    }

    // 4️⃣ Generate OTP
    const { otp, otpExpires } = otpGenerator(4, 10); // 4-digit OTP, 10 min expiry

    // 5️⃣ Create user in DB
    const user = await User.create({
        name,
        email,
        password,
        provider: "email",
        role,
        otp,
        otpExpires,
    });

    // 6️⃣ Send OTP email asynchronously (non-blocking)
    sendOTPEmail({ to: email, toName: name, otp }).catch((err: Error) =>
        logger.error(`[OTP Email Async Error] ${err.message}`)
    );

    // 7️⃣ Respond immediately
    return sendResponse(res, status.CREATED, "User registered successfully. OTP sent to email", {
        userId: user._id,
        name: name,
        email: email,
        role: role
    });
});

export const verifyOTP = catchAsync(async (req: Request, res: Response) => {
    const parsed = otpVerifySchema.safeParse(req.body);
    if (!parsed.success) {
        return sendResponse(res, status.BAD_REQUEST, "Invalid input", parsed.error.format());
    }

    const { email, otp } = parsed.data;

    const user = await User.findOne({ email }).select("+otp +otpExpires");
    if (!user) {
        return sendResponse(res, status.NOT_FOUND, "User not found");
    }

    if (!user.otp || !user.otpExpires) {
        return sendResponse(res, status.BAD_REQUEST, "No OTP found. Please request a new one");
    }

    if (new Date() > user.otpExpires) {
        return sendResponse(res, status.BAD_REQUEST, "OTP expired. Please request a new one");
    }

    if (user.otp !== otp) {
        return sendResponse(res, status.BAD_REQUEST, "Invalid OTP");
    }

    // ✅ OTP is valid → mark user as verified & remove OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return sendResponse(res, status.OK, "Email verified successfully");
});

export const googleLogin = catchAsync(async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
        return sendResponse(res, status.BAD_REQUEST, "Firebase ID token is required");
    }

    // 🔐 Verify Firebase token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);

    const { email, name, picture } = decodedToken;

    if (!email) {
        return sendResponse(res, status.UNAUTHORIZED, "Invalid Google account");
    }

    // 🔎 Check if user exists by email (not provider-specific first)
    let user = await User.findOne({ email });

    if (!user) {
        // 🆕 Create new Google user
        user = await User.create({
            name: name || email.split("@")[0],
            email,
            provider: "google",
            avatar: picture || "",
            isVerified: true,
            role: "user",
        });
    } else {
        // 🔄 If existing user but different provider
        if (user.provider !== "google") {
            user.provider = "google";
            user.isVerified = true;
            await user.save();
        }
    }

    // 🔑 Issue backend JWT
    // const token = signToken({
    //     userId: user._id,
    //     role: user.role,
    //     provider: user.provider,
    // });

    return sendResponse(
        res,
        status.OK,
        "Google login successful",
        {
            'token': '',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                provider: user.provider,
            },
        }
    );
});