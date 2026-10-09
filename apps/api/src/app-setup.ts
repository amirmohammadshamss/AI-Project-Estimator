import { serverConstants } from './config/server.constants';
import { runtimeEnvironment } from './config/runtime-environment';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

export function configureApp(app: INestApplication) {
  app.use(helmet());
  app.use(json({ limit: serverConstants.bodyLimit }));
  app.use(urlencoded({ extended: false, limit: serverConstants.bodyLimit }));
  app.use(cookieParser());

  app.enableCors({
    origin: runtimeEnvironment().webOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Project Estimator API')
    .setDescription('REST API for AI-assisted software project estimation')
    .setVersion('0.1.0')
    .addCookieAuth('access_token', { type: 'apiKey', in: 'cookie' }, 'cookieAuth')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);
}
