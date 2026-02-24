import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import * as cookieParser from 'cookie-parser'
import * as session from 'express-session'
import { createClient } from 'redis'

import { ms, StringValue } from '@/libs/utils/ms.util'
import { parseBoolean } from '@/libs/utils/parse-boolean.util'
import { RedisStore } from 'connect-redis'
import { AppModule } from './app.module'


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  const redis = createClient({
    url: config.getOrThrow<string>('REDIS_URL'),
  })

  redis.on('error', (error) => {
    console.error('Redis client error', error)
  })

  await redis.connect()

  app.use(
    session({
      store: new RedisStore({
        client: redis,
        prefix: config.getOrThrow<string>('REDIS_SESSION_PREFIX'),
      }),
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      name: config.getOrThrow<string>('SESSION_NAME'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        domain: config.get<string>('SESSION_DOMAIN') || undefined,
        maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
        httpOnly: parseBoolean(config.getOrThrow<string>('SESSION_HTTP_ONLY')),
        secure: parseBoolean(config.getOrThrow<string>('SESSION_SECURE')),
        sameSite: (config.get<string>('SESSION_SAME_SITE') || 'lax') as
          | 'lax'
          | 'strict'
          | 'none',
      },
    }),
  );

  app.enableCors({
    origin: config.getOrThrow<string>('APPLICATION_URL'),
    credentials: true,
  });

  const port = config.get<number>('PORT') ?? config.get<number>('APPLICATION_PORT') ?? 3001;
  await app.listen(port);}
bootstrap();
