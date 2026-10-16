import { randomUUID } from 'node:crypto';
import {
  CallHandler, Catch, type ArgumentsHost, type ExceptionFilter, HttpException,
  Injectable, type NestInterceptor,
} from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { createValidationPipe } from '../../validation.pipe.js';

type FieldError = { path: string; code: string; message: string };
type ErrorBody = {
  error: {
    code: string;
    message: string;
    field_errors: FieldError[];
    details: Record<string, unknown>;
    request_id: string;
    retryable: boolean;
  };
};

const codes: Record<number, string> = {
  400: 'MALFORMED_REQUEST', 401: 'AUTH_REQUIRED', 403: 'FORBIDDEN',
  404: 'NOT_FOUND', 409: 'VERSION_CONFLICT', 422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED', 500: 'INTERNAL_ERROR', 503: 'TEMPORARILY_UNAVAILABLE',
  504: 'AI_TIMEOUT',
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{
      status(code: number): { json(body: ErrorBody): void };
      setHeader(name: string, value: string): void;
    }>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const payload = exception instanceof HttpException ? exception.getResponse() : null;
    const object = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : {};
    const fieldErrors = Array.isArray(object.field_errors) ? object.field_errors as FieldError[] : [];
    const code = status < 500 && typeof object.code === 'string'
      ? object.code : codes[status] ?? 'INTERNAL_ERROR';
    const message = status === 400 ? 'Malformed request.'
      : typeof object.message === 'string' && status < 500
        ? object.message : status >= 500 ? 'The service is temporarily unavailable.' : 'Request could not be completed.';
    const requestId = randomUUID();
    response.setHeader('X-Request-Id', requestId);
    response.status(status).json({ error: {
      code, message, field_errors: fieldErrors,
      details: status < 500 && typeof object.details === 'object' && object.details !== null && !Array.isArray(object.details)
        ? object.details as Record<string, unknown> : {},
      request_id: requestId, retryable: status === 503 || status === 504,
    } });
  }
}

@Injectable()
export class ApiEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ArgumentsHost, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((value: unknown) => {
      if (value && typeof value === 'object' && 'data' in value && 'page' in value) return value;
      return { data: value };
    }));
  }
}

export function configureApiHttp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
}

