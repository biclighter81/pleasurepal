import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  //set cors to allow all
  app.enableCors();
  await app.listen(3001);
}
bootstrap();
