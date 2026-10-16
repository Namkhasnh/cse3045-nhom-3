import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';

export function createValidationPipe() {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => new UnprocessableEntityException({
      code: 'VALIDATION_ERROR', message: 'Check the highlighted fields.',
      field_errors: errors.map((error) => ({
        path: error.property, code: 'INVALID_VALUE', message: 'Invalid value.',
      })),
      details: {},
    }),
  });
}
