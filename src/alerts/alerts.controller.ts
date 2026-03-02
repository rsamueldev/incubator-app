import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';

@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) { }

    @Post()
    create(@Body() createAlertDto: CreateAlertDto) {
        return this.alertsService.create(createAlertDto);
    }

    @Get(':deviceId')
    getByDevice(
        @Param('deviceId') deviceId: string,
        @Query('limit') limit?: string,
    ) {
        return this.alertsService.getByDevice(deviceId, limit ? parseInt(limit) : 20);
    }
}
