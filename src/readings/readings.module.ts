import { Module } from '@nestjs/common';
import { ReadingsService } from './readings.service';
import { ReadingsController } from './readings.controller';
import { AlertsModule } from '../alerts/alerts.module';
import { DevicesModule } from '../devices/devices.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        AlertsModule,
        DevicesModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'fallback_secret',
            }),
        }),
    ],
    controllers: [ReadingsController],
    providers: [ReadingsService],
})
export class ReadingsModule { }
