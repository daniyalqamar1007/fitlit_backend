import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  origin: ['http://localhost:3001'], // allowed origins
  methods: 'GET,POST,PUT,DELETE',
  credentials: true, // allow cookies and authorization headers
});

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
