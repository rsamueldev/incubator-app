import { Module } from '@nestjs/common';
import { ReadingsService } from './readings.service';
import { ReadingsController } from './readings.controller';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
    imports: [AlertsModule],
    controllers: [ReadingsController],
    providers: [ReadingsService],
})
export class ReadingsModule { }
