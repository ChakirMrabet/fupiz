import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  // Keep browser access scoped to the configured frontend instead of allowing
  // arbitrary origins to exercise authenticated APIs from any site.
  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  });
  app.setGlobalPrefix('api', {
    exclude: ['s/:shortCode', 's/:shortCode/verify-password'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
