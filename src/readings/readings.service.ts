import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RedisService } from '../redis/redis.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertsService } from '../alerts/alerts.service';
import { AlertType } from '../alerts/dto/create-alert.dto';
import { DevicesService } from '../devices/devices.service';

@Injectable()
export class ReadingsService {
    private readonly logger = new Logger(ReadingsService.name);

    constructor(
        private supabaseService: SupabaseService,
        private redisService: RedisService,
        private alertsService: AlertsService,
        private devicesService: DevicesService,
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

        try {
            // Guardado de lectura en Redis (No bloqueante para la respuesta final)
            const redisKey = `device:${device_id}:latest`;
            this.redisService.set(redisKey, {
                temperature,
                humidity,
                timestamp: new Date().toISOString(),
            }, 3600).catch(err => this.logger.error(`Redis Error: ${err.message}`));

            // Guardado en Supabase
            const { data, error } = await this.supabaseService
                .getClient()
                .from('Reading')
                .insert({
                    device_id,
                    temperature,
                    humidity,
                })
                .select()
                .maybeSingle();

            if (error) {
                this.logger.error(`[SUPABASE ERROR] ${error.message}`);
                return data || { success: false, error: error.message };
            }

            // --- Lógica de Alertas en Segundo Plano ---
            (async () => {
                try {
                    const device = await this.devicesService.findById(device_id);
                    if (device) {
                        const setpoint = (device.mode === 2) ? 37.75 : 37.65;
                        if (temperature < setpoint + 0.3 && temperature > setpoint - 0.3) {
                            await this.alertsService.resolveAlerts(device_id, [AlertType.TEMP_HIGH, AlertType.TEMP_LOW]);
                        } else if (temperature < setpoint + 0.3) {
                            await this.alertsService.resolveAlerts(device_id, [AlertType.TEMP_HIGH]);
                        } else if (temperature > setpoint - 0.3) {
                            await this.alertsService.resolveAlerts(device_id, [AlertType.TEMP_LOW]);
                        }

                        if (humidity <= 78.0 && humidity >= 42.0) {
                            await this.alertsService.resolveAlerts(device_id, [AlertType.HUM_HIGH, AlertType.HUM_LOW]);
                        } else if (humidity <= 78.0) {
                            await this.alertsService.resolveAlerts(device_id, [AlertType.HUM_HIGH]);
                        } else if (humidity >= 42.0) {
                            await this.alertsService.resolveAlerts(device_id, [AlertType.HUM_LOW]);
                        }
                    }
                    await this.alertsService.resolveTimedAlerts(device_id);
                } catch (e) {
                    this.logger.error(`Alert resolve error: ${e.message}`);
                }
            })();

            return data || { success: true };
        } catch (globalError) {
            this.logger.error(`CRITICAL ERROR in create reading: ${globalError.message}`);
            return { success: false, message: globalError.message };
        }
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
            .maybeSingle();

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

