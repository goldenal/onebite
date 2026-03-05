import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createErrorEnvelope } from '../errors/error-response';
import { mapPrismaError } from '../errors/prisma-error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const prismaError = mapPrismaError(exception);
    if (prismaError) {
      response.status(prismaError.statusCode).json(
        createErrorEnvelope({
          statusCode: prismaError.statusCode,
          code: prismaError.code,
          message: prismaError.message,
          details: prismaError.details,
          path: request.url,
        }),
      );
      return;
    }

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isHttp ? exception.getResponse() : null;

    const payloadObject = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
    const payloadMessage = typeof payload === 'string' ? payload : payloadObject.message;
    const details = Array.isArray(payloadMessage) ? payloadMessage : payloadObject.details;
    const message = Array.isArray(payloadMessage) ? 'validation failed' : typeof payloadMessage === 'string' ? payloadMessage : '';
    const codeCandidate =
      typeof payloadObject.code === 'string'
        ? payloadObject.code
        : typeof payloadObject.error === 'string'
          ? payloadObject.error
          : message;

    const body = createErrorEnvelope({
      statusCode: status,
      code: codeCandidate,
      message: message || (isHttp ? String(HttpStatus[status] || '') : 'internal server error'),
      details,
      path: request.url,
    });

    response.status(status).json(body);
  }
}
