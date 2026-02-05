"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const nestjs_pino_1 = require("nestjs-pino");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true, rawBody: true, logger: ['error', 'warn', 'log'] });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    const origins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.enableCors({
        origin: origins.length ? origins : true,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.setGlobalPrefix('api', { exclude: ['healthz', 'readyz', 'webhooks/stripe', 'webhooks/delivery'] });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Bite Creole API')
        .setDescription('NestJS rewrite (dev)')
        .setVersion('0.1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
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
