import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Включаем CORS для фронтенда
  app.enableCors({
    origin: '*', // Для разработки можно разрешить всем, или указать 'http://localhost:3001'
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FlashCards API')
    .setDescription(
      'API for authentication, flashcard modules, and dictionary lookups',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend is running on http://localhost:${port}`);
  console.log(`Swagger is available on http://localhost:${port}/api/docs`);
}
void bootstrap();
