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
  origin: true,
  methods: 'GET,POST,PUT,DELETE',
  credentials: true, // allow cookies and authorization headers
});

  await app.listen(3099);
}
bootstrap();
