import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import * as cookieParser from 'cookie-parser'
import * as session from 'express-session'
import { createClient } from 'redis'
import { randomBytes } from 'crypto'

import { ms, StringValue } from '@/libs/utils/ms.util'
import { parseBoolean } from '@/libs/utils/parse-boolean.util'
import { RedisStore } from 'connect-redis'
import { AppModule } from './app.module'


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  if (config.get<string>('NODE_ENV') === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')));

  const allowedOrigin = config.get<string>('APPLICATION_URL');
  if (config.get<string>('NODE_ENV') === 'production' && allowedOrigin) {
    app.use((req, res, next) => {
      const method = req.method.toUpperCase();
      if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
        return next();
      }

      const origin = req.headers.origin;
      if (!origin || origin !== allowedOrigin) {
        return res.status(403).json({ message: 'Invalid origin.' });
      }

      return next();
    });
  }

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
      proxy: config.get<string>('NODE_ENV') === 'production',
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

  const csrfCookieName = config.get<string>('CSRF_COOKIE_NAME') ?? 'csrf_token';
  const csrfCookieOptions = {
    domain: config.get<string>('SESSION_DOMAIN') || undefined,
    path: '/',
    httpOnly: false,
    secure: parseBoolean(config.getOrThrow<string>('SESSION_SECURE')),
    sameSite: (config.get<string>('SESSION_SAME_SITE') || 'lax') as
      | 'lax'
      | 'strict'
      | 'none',
  };

  app.use((req, res, next) => {
    const hasSession = typeof req.session !== 'undefined';
    const hasUser = hasSession && typeof req.session.userId !== 'undefined';

    if (!hasSession || !hasUser) {
      return next();
    }

    if (!req.session.csrfToken) {
      req.session.csrfToken = randomBytes(32).toString('hex');
    }

    res.cookie(csrfCookieName, req.session.csrfToken, csrfCookieOptions);

    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const headerToken =
        (req.headers['x-csrf-token'] as string | undefined) ||
        (req.body?._csrf as string | undefined);

      if (!headerToken || headerToken !== req.session.csrfToken) {
        return res.status(403).json({ message: 'Invalid CSRF token.' });
      }
    }

    return next();
  });

  app.enableCors({
    origin: config.getOrThrow<string>('APPLICATION_URL'),
    credentials: true,
  });

  const port = config.get<number>('PORT') ?? config.get<number>('APPLICATION_PORT') ?? 3001;
  await app.listen(port);}
bootstrap();
