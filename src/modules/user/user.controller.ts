import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import status from "http-status";
import User from "./user.model";
import otpGenerator from "../../utils/otpGenerator";
import { sendOTPEmail } from "../../utils/sendOtpEmail";
import logger from "../../utils/logger";

