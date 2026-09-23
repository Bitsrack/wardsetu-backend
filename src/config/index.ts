import type { ConfigService } from '@nestjs/config';
import type { AppConfig } from './configuration';

export { default as configuration, buildConfiguration } from './configuration';
export type { AppConfig } from './configuration';
export * from './env.validation';

/** Strongly-typed ConfigService: `config.get('app', { infer: true })`. */
export type TypedConfigService = ConfigService<AppConfig, true>;
