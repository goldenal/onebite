import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { enrichSwaggerDocument } from './common/swagger/swagger-docs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true, logger: ['error', 'warn', 'log'] });
  app.useLogger(app.get(Logger));

  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length ? origins : true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api', { exclude: ['healthz', 'readyz', 'webhooks/stripe', 'webhooks/stripe-connect', 'webhooks/delivery'] });

  const config = new DocumentBuilder()
    .setTitle('Bite Creole API')
    .setDescription('NestJS rewrite (dev)')
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();
  const document = enrichSwaggerDocument(SwaggerModule.createDocument(app, config));
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3002;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`NestJS server listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger documentation available at http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start NestJS app:', err);
  process.exit(1);
});
