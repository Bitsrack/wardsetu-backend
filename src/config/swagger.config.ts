import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_PATH } from '../common/constants';

export const SWAGGER_TITLE = 'WardSetu Backend API';
export const SWAGGER_DESCRIPTION = 'WardSetu civic and election management platform API.';
export const SWAGGER_VERSION = '1.0';

/** Serves the OpenAPI UI at `/<prefix>/docs` and JSON at `/<prefix>/docs-json`. */
export function setupSwagger(app: INestApplication, apiPrefix: string): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(SWAGGER_TITLE)
      .setDescription(SWAGGER_DESCRIPTION)
      .setVersion(SWAGGER_VERSION)
      // Prepared for JWT auth; no endpoint requires it yet.
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .build(),
  );
  SwaggerModule.setup(`${apiPrefix}/${SWAGGER_PATH}`, app, document);
}
