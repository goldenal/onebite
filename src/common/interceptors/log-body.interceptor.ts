import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'nestjs-pino';

@Injectable()
export class LogBodyInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const start = Date.now();
    const reqBody = req.body;

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const durationMs = Date.now() - start;
          this.logger.log(
            {
              msg: `${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${durationMs}ms`,
              method: req.method,
              url: req.originalUrl || req.url,
              statusCode: res.statusCode,
              durationMs,
              reqBody,
              resBody: responseBody,
            },
            'api',
          );
        },
        error: (error) => {
          const durationMs = Date.now() - start;
          const statusCode = error.status || 500;

          this.logger.error(
            {
              msg: `ERROR ${req.method} ${req.originalUrl || req.url} ${statusCode} - ${durationMs}ms`,
              method: req.method,
              url: req.originalUrl || req.url,
              statusCode,
              durationMs,
              reqBody,
              error: error.message || error,
            },
            error.stack,
            'api',
          );
        },
      }),
    );
  }
}
