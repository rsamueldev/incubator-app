import { Controller, Get, Post, Body, Param, Query, Delete, Res, Header, UseGuards, Request, Logger } from '@nestjs/common';
import { ReadingsService } from './readings.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response } from 'express';


@Controller('readings')
export class ReadingsController {
    private readonly logger = new Logger(ReadingsController.name);
    constructor(private readonly readingsService: ReadingsService) { }

    // Recibe la lectura de la esp8266 y la guarda en la base de datos
    @Post()
    create(@Body() createReadingDto: CreateReadingDto) {
        this.logger.log(`Incoming reading from device: ${createReadingDto.device_id} [T: ${createReadingDto.temperature}°C, H: ${createReadingDto.humidity}%]`);
        return this.readingsService.create(createReadingDto);
    }

    // Obtiene la ultima lectura de un dispositivo
    @UseGuards(JwtAuthGuard)
    @Get('latest/:deviceId')
    getLatest(@Param('deviceId') deviceId: string) {
        return this.readingsService.getLatest(deviceId);
    }

    // Obtiene el historial de lecturas de un dispositivo
    @UseGuards(JwtAuthGuard)
    @Get('history/:deviceId')
    getHistory(
        @Param('deviceId') deviceId: string,
        @Query('limit') limit?: string,
    ) {
        return this.readingsService.getHistory(deviceId, limit ? parseInt(limit) : 50);
    }

    // Exporta los datos a un archivo CSV para que el usuario los guarde y libere espacio
    @Get('export/:deviceId')
    @Header('Content-Type', 'text/csv')
    @Header('Content-Disposition', 'attachment; filename=lecturas_incubadora.csv')
    async exportCSV(@Param('deviceId') deviceId: string, @Res() res: Response) {
        const csv = await this.readingsService.generateCSV(deviceId);
        return res.send(csv);
    }

    // Borra datos antiguos (por defecto con mas de 24 horas para liberar espacio diario)
    @Delete('clean/:deviceId')
    cleanOldReadings(
        @Param('deviceId') deviceId: string,
        @Query('days') days?: string,
    ) {
        return this.readingsService.deleteOldReadings(deviceId, days ? parseInt(days) : 1);
    }

}

