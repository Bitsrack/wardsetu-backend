import {
  type EnvironmentVariables,
  LogLevel,
  NodeEnvironment,
  validateEnv,
} from './env.validation';

export interface AppConfig {
  app: {
    nodeEnv: NodeEnvironment;
    isProduction: boolean;
    host: string;
    port: number;
    apiPrefix: string;
    requestBodyLimit: string;
  };
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origins: string[];
  };
  swagger: {
    enabled: boolean;
  };
  log: {
    level: LogLevel;
  };
}

export function buildConfiguration(env: EnvironmentVariables): AppConfig {
  return {
    app: {
      nodeEnv: env.NODE_ENV,
      isProduction: env.NODE_ENV === NodeEnvironment.Production,
      host: env.HOST,
      port: env.PORT,
      apiPrefix: env.API_PREFIX,
      requestBodyLimit: env.REQUEST_BODY_LIMIT,
    },
    database: {
      url: env.DATABASE_URL,
    },
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
    },
    cors: {
      origins: env.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    },
    swagger: {
      enabled: env.SWAGGER_ENABLED,
    },
    log: {
      level: env.LOG_LEVEL,
    },
  };
}

/** Configuration factory registered with `ConfigModule.forRoot({ load })`. */
export default (): AppConfig => buildConfiguration(validateEnv(process.env));
