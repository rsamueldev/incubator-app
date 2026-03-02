import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RedisService } from '../redis/redis.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertsService } from '../alerts/alerts.service';
import { AlertType } from '../alerts/dto/create-alert.dto';

@Injectable()
export class ReadingsService {
    private readonly logger = new Logger(ReadingsService.name);

    constructor(
        private supabaseService: SupabaseService,
        private redisService: RedisService,
        private alertsService: AlertsService,
    ) { }

    // Tarea automática (Cron) que se ejecuta cada noche a las 12:00 AM
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailyCleanup() {
        this.logger.log('Iniciando limpieza automática de lecturas (Reseteo diario 12:00 AM)...');

        const dateLimit = new Date();
        dateLimit.setHours(0, 0, 0, 0); // Todo lo anterior al inicio de hoy

        const { error } = await this.supabaseService
            .getClient()
            .from('Reading')
            .delete()
            .lt('created_at', dateLimit.toISOString());

        if (error) {
            this.logger.error(`Error en la limpieza automática: ${error.message}`);
        } else {
            this.logger.log('Limpieza automática completada con éxito.');
        }
    }


    async create(createReadingDto: CreateReadingDto) {
        const { device_id, temperature, humidity } = createReadingDto;

        // Guardado de lectura en Redis para acceder a los datos en tiempo real
        const redisKey = `device:${device_id}:latest`;
        await this.redisService.set(redisKey, {
            temperature,
            humidity,
            timestamp: new Date().toISOString(),
        }, 3600); // 1 hora de TTL por seguridad

        // Muestra lecturas en tiempo real en la consola
        this.logger.log(`[REAL-TIME] Reading stored in Redis for device ${device_id}: ${temperature}°C, ${humidity}%`);


        // Guardado de lectura en Supabase para datos historicos
        const { data, error } = await this.supabaseService
            .getClient()
            .from('Reading')
            .insert({
                device_id,
                temperature,
                humidity,
            })
            .select()
            .single();

        if (error) {
            this.logger.error(`Error saving reading to Supabase: ${error.message}`);
            // No lanzamos error para no bloquear la ESP8266 si Supabase no está disponible
        }

        // --- Lógica de Resolución de Alertas ---

        // 1. Resolver alertas de Temperatura (Rango normal: 37.1 - 37.9)
        if (temperature >= 37.1 && temperature <= 37.9) {
            await this.alertsService.resolveAlerts(device_id, [AlertType.TEMP_HIGH, AlertType.TEMP_LOW]);
        }

        // 2. Resolver alertas de Humedad (Rango normal: +/- 5% del setpoint estimado de 50-70%)
        // Como el setpoint varía, usamos un rango razonable de "normalidad" o podrías ajustarlo
        if (humidity >= 45 && humidity <= 75) {
            await this.alertsService.resolveAlerts(device_id, [AlertType.HUM_HIGH, AlertType.HUM_LOW]);
        }

        // 3. Resolver alertas de Motor antiguas (20 min)
        await this.alertsService.resolveTimedAlerts(device_id);

        return data;
    }

    // Obtiene la ultima lectura de un dispositivo
    async getLatest(deviceId: string) {
        // Busca la lectura en Redis
        const redisKey = `device:${deviceId}:latest`;
        const cached = await this.redisService.get(redisKey);
        if (cached) return cached;

        // LLama a Supabase si Redis no tiene la lectura
        const { data, error } = await this.supabaseService
            .getClient()
            .from('Reading')
            .select('*')
            .eq('device_id', deviceId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return data;
    }

    // Obtiene el historial de lecturas de un dispositivo
    async getHistory(deviceId: string, limit = 50) {
        // Busca el historial de lecturas en Supabase
        const { data, error } = await this.supabaseService
            .getClient()
            .from('Reading')
            .select('*')
            .eq('device_id', deviceId)
            .order('created_at', { ascending: false })
            .limit(limit);

        return data;
    }

    // Genera un archivo CSV optimizado para Excel
    async generateCSV(deviceId: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('Reading')
            .select('created_at, temperature, humidity')
            .eq('device_id', deviceId)
            .order('created_at', { ascending: true });

        if (error || !data) return '';

        // BOM para que Excel detecte UTF-8 correctamente
        const BOM = '\uFEFF';
        // Cabecera con punto y coma (más compatible con Excel en español)
        let csv = BOM + 'Fecha;Temperatura (°C);Humedad (%)\n';

        // Filas del CSV con fechas formateadas
        data.forEach(row => {
            const date = new Date(row.created_at).toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            csv += `${date};${row.temperature.toString().replace('.', ',')};${row.humidity.toString().replace('.', ',')}\n`;
        });

        return csv;
    }

    // Borra lecturas antiguas para ahorrar espacio (ahora por defecto cada 24 horas)
    async deleteOldReadings(deviceId: string, days = 1) {

        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);

        const { error } = await this.supabaseService
            .getClient()
            .from('Reading')
            .delete()
            .eq('device_id', deviceId)
            .lt('created_at', dateLimit.toISOString());

        if (error) {
            this.logger.error(`Error deleting old readings: ${error.message}`);
            throw error;
        }

        return { message: `Readings older than ${days} days deleted` };
    }
}

