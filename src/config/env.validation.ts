import { plainToInstance, Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  validateSync,
} from 'class-validator';

export enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
}

/** WardSetu must only ever bind to the loopback interface on this port. */
export const REQUIRED_HOST = '127.0.0.1';
export const REQUIRED_PORT = 2010;

const PLACEHOLDER_SECRET = 'CHANGE_ME';
const MIN_PRODUCTION_SECRET_LENGTH = 32;

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const normalised = value.trim().toLowerCase();
  if (normalised === 'true') return true;
  if (normalised === 'false') return false;
  return value;
};

const toInteger = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : value;

export class EnvironmentVariables {
  @IsEnum(NodeEnvironment)
  NODE_ENV: NodeEnvironment;

  @Equals(REQUIRED_HOST, { message: `HOST must be ${REQUIRED_HOST}` })
  HOST: string;

  @Transform(toInteger)
  @IsInt()
  @Equals(REQUIRED_PORT, { message: `PORT must be ${REQUIRED_PORT}` })
  PORT: number;

  @IsString()
  @Matches(/^[a-z0-9][a-z0-9/-]*$/i, { message: 'API_PREFIX must be a simple path segment' })
  API_PREFIX: string;

  @IsString()
  @Matches(/^postgres(ql)?:\/\/.+/, { message: 'DATABASE_URL must be a PostgreSQL connection URL' })
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string = '1d';

  @IsOptional()
  @IsString()
  CORS_ORIGINS: string = '';

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  SWAGGER_ENABLED: boolean = true;

  @IsOptional()
  @IsEnum(LogLevel)
  LOG_LEVEL: LogLevel = LogLevel.Info;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(b|kb|mb)$/i, { message: 'REQUEST_BODY_LIMIT must look like 100kb or 1mb' })
  REQUEST_BODY_LIMIT: string = '1mb';
}

/** Rules that depend on more than one variable, or only apply in production. */
function crossFieldErrors(env: EnvironmentVariables): string[] {
  const errors: string[] = [];
  if (env.NODE_ENV !== NodeEnvironment.Production) return errors;

  if (
    env.JWT_SECRET === PLACEHOLDER_SECRET ||
    env.JWT_SECRET.length < MIN_PRODUCTION_SECRET_LENGTH
  ) {
    errors.push(
      `JWT_SECRET must be a real secret of at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production`,
    );
  }
  if (env.DATABASE_URL.includes(PLACEHOLDER_SECRET)) {
    errors.push('DATABASE_URL must not contain placeholder credentials in production');
  }
  const origins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
  if (origins.includes('*')) {
    errors.push('CORS_ORIGINS must not contain "*" in production');
  }
  return errors;
}

/**
 * Validates the raw process environment and fails fast on the first startup
 * with an invalid configuration. Error messages name the variable but never
 * echo its value, so secrets cannot leak into logs.
 */
export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
    exposeDefaultValues: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  const messages = errors.flatMap((error) =>
    Object.values(error.constraints ?? {}).map((message) => message),
  );
  if (messages.length === 0) messages.push(...crossFieldErrors(validated));

  if (messages.length > 0) {
    throw new Error(`Invalid environment configuration:\n  - ${messages.join('\n  - ')}`);
  }
  return validated;
}
