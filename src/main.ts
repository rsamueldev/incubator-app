import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  app.enableCors();
  const port = process.env.PORT ?? 3000;

  // Vercel handles the listening, but we still need this for local development
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(port, '0.0.0.0');
    console.log(`\n🚀 Backend Incubadora iniciado localmente!`);
    console.log(`🏠 Acceso Local: http://localhost:${port}`);
    console.log(`🌐 Acceso ESP8266: http://192.168.0.17:${port}\n`);
  }

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp;
}

// Exportamos el manejador para Vercel
let server: any;

export default async (req: any, res: any) => {
  if (!server) {
    server = await bootstrap();
  }
  return server(req, res);
};
