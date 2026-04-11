import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor<unknown, unknown> {
  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: unknown) => {
        if (response.headersSent || data === undefined) {
          return data;
        }

        if (data && typeof data === 'object' && 'success' in (data as Record<string, unknown>)) {
          return data;
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
