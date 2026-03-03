import { Controller, Post, Get, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('alerts')
export class AlertsController {
    private readonly logger = new Logger(AlertsController.name);
    constructor(private readonly alertsService: AlertsService) { }

    @Post()
    create(@Body() createAlertDto: CreateAlertDto) {
        this.logger.log(`Incoming alert from device: ${createAlertDto.device_id} - Type: ${createAlertDto.type}`);
        return this.alertsService.create(createAlertDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':deviceId')
    getByDevice(
        @Param('deviceId') deviceId: string,
        @Query('limit') limit?: string,
    ) {
        return this.alertsService.getByDevice(deviceId, limit ? parseInt(limit) : 20);
    }
}
