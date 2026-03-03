import { Controller, Post, Get, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { LinkDeviceDto, SyncModeDto } from './dto/device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('devices')
export class DevicesController {
    private readonly logger = new Logger(DevicesController.name);
    constructor(private readonly devicesService: DevicesService) { }

    @UseGuards(JwtAuthGuard)
    @Post('link')
    linkDevice(@Request() req, @Body() linkDeviceDto: LinkDeviceDto) {
        return this.devicesService.linkDevice(req.user.userId, linkDeviceDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    getUserDevices(@Request() req) {
        return this.devicesService.getUserDevices(req.user.userId);
    }

    // This endpoint is for the ESP8266, no auth for simplicity or use a device token
    @Post('sync-mode')
    async syncMode(@Body() body: any) {
        this.logger.log(`Incoming mode sync from device: ${body.device_id} -> Mode: ${body.mode}`);
        try {
            const result = await this.devicesService.syncMode(body);
            this.logger.log(`Mode sync successful for device: ${body.device_id}`);
            return result;
        } catch (error) {
            this.logger.error(`Error syncing mode for device ${body.device_id}: ${error.message}`);
            throw error;
        }
    }
}
