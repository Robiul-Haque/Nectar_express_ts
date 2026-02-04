import 'dotenv-safe/config';

export const env = {
    PORT: process.env.PORT || 5000,
    DB_URL: process.env.DB_URL as string,
    NODE_ENV: process.env.NODE_ENV,
};