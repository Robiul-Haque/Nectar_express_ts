import mongoose from 'mongoose';
import app from './app';
import { env } from './config/env';
import logger from './utils/logger';

async function bootstrap() {
    await mongoose.connect(env.DB_URL);
    logger.info('DB connected');

    app.listen(env.PORT, () => {
        logger.info(`Server running on port ${env.PORT}`);
    });
}

bootstrap();