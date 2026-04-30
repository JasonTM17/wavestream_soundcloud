import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getValidatedEnv } from 'src/config/env.validation';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const isLoopbackOrigin = (origin: string) => {
  try {
    const url = new URL(origin);
    return LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
};

async function bootstrap() {
  const env = getValidatedEnv();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (env.frontendOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (env.allowLoopbackCors && isLoopbackOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin ${origin} is not allowed`), false);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WaveStream API')
    .setDescription('WaveStream music streaming platform API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(env.port);
}
void bootstrap();
