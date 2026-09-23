import { Injectable, type LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SERVICE_NAME } from '../constants';
import { redact } from '../utils';
import { type AppConfig, LogLevel } from '../../config';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.Error]: 0,
  [LogLevel.Warn]: 1,
  [LogLevel.Info]: 2,
  [LogLevel.Debug]: 3,
};

export type LogFields = Record<string, unknown>;

interface LogEntry extends LogFields {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: string;
}

/**
 * Structured application logger.
 *
 * - production: one JSON object per line (machine-parseable)
 * - otherwise:  `INFO [wardsetu-backend] message {fields}`
 *
 * Every extra field passes through `redact()`, so secrets, tokens and
 * connection strings are never written out.
 */
@Injectable()
export class AppLogger implements LoggerService {
  private readonly threshold: number;
  private readonly json: boolean;

  constructor(config: ConfigService<AppConfig, true>) {
    this.threshold = LEVEL_PRIORITY[config.get('log.level', { infer: true })];
    this.json = config.get('app.isProduction', { infer: true });
  }

  // LoggerService (used by Nest internals): (message, ...optionalParams, context?)
  log(message: unknown, ...params: unknown[]): void {
    this.fromNest(LogLevel.Info, message, params);
  }
  error(message: unknown, ...params: unknown[]): void {
    this.fromNest(LogLevel.Error, message, params);
  }
  warn(message: unknown, ...params: unknown[]): void {
    this.fromNest(LogLevel.Warn, message, params);
  }
  debug(message: unknown, ...params: unknown[]): void {
    this.fromNest(LogLevel.Debug, message, params);
  }
  verbose(message: unknown, ...params: unknown[]): void {
    this.fromNest(LogLevel.Debug, message, params);
  }
  fatal(message: unknown, ...params: unknown[]): void {
    this.fromNest(LogLevel.Error, message, params);
  }

  /** Application-facing API with structured fields. */
  write(level: LogLevel, message: string, fields: LogFields = {}, context?: string): void {
    if (LEVEL_PRIORITY[level] > this.threshold) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: SERVICE_NAME,
      message,
      ...(context ? { context } : {}),
      ...(redact(fields) as LogFields),
    };
    const stream = level === LogLevel.Error ? process.stderr : process.stdout;
    stream.write(`${this.json ? JSON.stringify(entry) : this.pretty(entry)}\n`);
  }

  private fromNest(level: LogLevel, message: unknown, params: unknown[]): void {
    const rest = [...params];
    const context =
      rest.length > 0 && typeof rest[rest.length - 1] === 'string'
        ? (rest.pop() as string)
        : undefined;
    const fields: LogFields = {};
    // Nest passes the stack trace as the first optional param of error().
    if (level === LogLevel.Error && typeof rest[0] === 'string') fields.stack = rest.shift();
    if (rest.length > 0) fields.details = rest;

    if (message instanceof Error) {
      fields.error = message.name;
      if (!fields.stack && message.stack) fields.stack = message.stack;
      this.write(level, message.message, fields, context);
      return;
    }
    if (typeof message === 'object' && message !== null) {
      this.write(level, 'log', { ...(message as LogFields), ...fields }, context);
      return;
    }
    this.write(level, String(message), fields, context);
  }

  private pretty({ timestamp, level, service, message, context, ...fields }: LogEntry): string {
    const { stack, ...rest } = fields;
    const scope = context ? ` (${context})` : '';
    const extra = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
    const trace = typeof stack === 'string' ? `\n${stack}` : '';
    return `${timestamp} ${level.toUpperCase()} [${service}]${scope} ${message}${extra}${trace}`;
  }
}
