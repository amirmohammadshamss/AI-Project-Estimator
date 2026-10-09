import { runtimeEnvironment } from './config/runtime-environment';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app-setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableShutdownHooks();
  const port = runtimeEnvironment().port;
  await app.listen(port);
}
bootstrap();
