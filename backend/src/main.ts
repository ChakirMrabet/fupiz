import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api', {
    exclude: ['s/:shortCode', 's/:shortCode/verify-password'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
