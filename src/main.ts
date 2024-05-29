import { LoggerFactory } from '@fiu-fit/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const logger = LoggerFactory('main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(); //  magic line

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = parseInt(process.env.PORT || '8080');
  await app.listen(port);

  logger.info(`App is running on PORT: ${port}`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
