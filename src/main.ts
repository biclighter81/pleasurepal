import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import SocketAuthIoAdapter from './lib/socket-io.adapter';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app: app.getHttpServer() }),
    ],
    tracesSampleRate: 1.0,
  });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  app.use(Sentry.Handlers.errorHandler());
  app.setGlobalPrefix('api');
  //set cors to allow all
  app.enableCors();
  const socketAuthAdapter = new SocketAuthIoAdapter(app);
  await socketAuthAdapter.connectRedis();
  app.useWebSocketAdapter(socketAuthAdapter);
  await app.listen(3001);
}
bootstrap();
