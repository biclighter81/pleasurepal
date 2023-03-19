import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import SocketAuthIoAdapter from './lib/socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  //set cors to allow all
  app.enableCors();
  const socketAuthAdapter = new SocketAuthIoAdapter(app);
  app.useWebSocketAdapter(socketAuthAdapter);
  await app.listen(3001);
}
bootstrap();
