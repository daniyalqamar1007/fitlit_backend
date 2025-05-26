import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as http from 'http';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
// Set timeout to 5 minutes (300,000 ms)
  const server = http.createServer(app.getHttpAdapter().getInstance());
  server.setTimeout(300000); // 5 minutes
  
  // Enable validation and transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      transform: true, // Enable automatic transformation
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://zqxct4xv-3000.inc1.devtunnels.ms',
      'https://fitlit-admin-panel.vercel.app',
      'http://147.93.47.17:3098',
    ],
    methods: 'GET,POST,PUT,DELETE',
    credentials: true, // allow cookies and authorization headers
  });

  await app.listen(3099);
}
bootstrap();
