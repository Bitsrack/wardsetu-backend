import { BadRequestException, type ValidationError, ValidationPipe } from '@nestjs/common';

export interface FieldValidationError {
  field: string;
  errors: string[];
}

function flatten(errors: ValidationError[], parent = ''): FieldValidationError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = error.constraints ? [{ field, errors: Object.values(error.constraints) }] : [];
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

/** The single global validation pipe for every DTO. */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    // Never echo rejected values back to the client.
    validationError: { target: false, value: false },
    exceptionFactory: (errors) =>
      new BadRequestException({ message: 'Validation failed', details: flatten(errors) }),
  });
}
