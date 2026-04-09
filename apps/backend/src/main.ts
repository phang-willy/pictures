import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Starter Fullstack API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, swaggerDocument);
  }

  const port = Number(process.env.BACKEND_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port);
}
void bootstrap();
