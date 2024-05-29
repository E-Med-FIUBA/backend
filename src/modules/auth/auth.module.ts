import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServiceConfig, ServiceName } from '../../shared/service-config';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule.registerAsync({
      imports:    [ConfigModule],
      useFactory: (configService: ConfigService) =>
        ServiceConfig.createHttpModuleOptions(ServiceName.User, configService),
      inject: [ConfigService],
    }),
  ],
  exports:     [],
  providers:   [],
  controllers: [AuthController],
})
export class AuthModule {}
