import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAlertDto, AlertType } from './dto/create-alert.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AlertsService {
    private readonly logger = new Logger(AlertsService.name);

    constructor(private supabaseService: SupabaseService) { }

    async create(createAlertDto: CreateAlertDto) {
        const { device_id, type, message } = createAlertDto;

        this.logger.warn(`[ALERT] Device ${device_id}: ${type} - ${message}`);

        // Persistencia en Supabase
        const { data, error } = await this.supabaseService
            .getClient()
            .from('Alert')
            .insert({
                device_id,
                type,
                message,
                is_resolved: false,
            })
            .select()
            .single();


        if (error) {
            this.logger.error(`Error saving alert to Supabase: ${error.message}`);
        }

        return data;
    }

    // Obtiene los alertas de un dispositivo
    async getByDevice(deviceId: string, limit = 20) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('Alert')
            .select('*')
            .eq('device_id', deviceId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            this.logger.error(`Error fetching alerts: ${error.message}`);
            return [];
        }

        return data;
    }

    // Marca alertas específicas como resueltas
    async resolveAlerts(deviceId: string, alertTypes: AlertType[]) {
        const { error } = await this.supabaseService
            .getClient()
            .from('Alert')
            .update({ is_resolved: true })
            .eq('device_id', deviceId)
            .in('type', alertTypes)
            .eq('is_resolved', false);

        if (error) {
            this.logger.error(`Error resolving alerts for ${deviceId}: ${error.message}`);
        } else {
            this.logger.log(`[ALERT RESOLVED] Types ${alertTypes.join(', ')} for device ${deviceId}`);
        }
    }

    // Resuelve alertas de motor basadas en tiempo (20 minutos)
    async resolveTimedAlerts(deviceId: string) {
        const twentyMinutesAgo = new Date();
        twentyMinutesAgo.setMinutes(twentyMinutesAgo.getMinutes() - 20);

        const { error } = await this.supabaseService
            .getClient()
            .from('Alert')
            .update({ is_resolved: true })
            .eq('device_id', deviceId)
            .eq('type', AlertType.MOTOR_ACTIVE)
            .eq('is_resolved', false)
            .lt('created_at', twentyMinutesAgo.toISOString());

        if (error) {
            this.logger.error(`Error resolving timed alerts for ${deviceId}: ${error.message}`);
        }
    }

    // Tarea automática de limpieza diaria a las 12:00 AM
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailyCleanup() {
        this.logger.log('Iniciando limpieza automática de alertas (Reseteo diario 12:00 AM)...');

        const dateLimit = new Date();
        dateLimit.setHours(0, 0, 0, 0); // Borra alertas de días anteriores

        const { error } = await this.supabaseService
            .getClient()
            .from('Alert')
            .delete()
            .lt('created_at', dateLimit.toISOString());

        if (error) {
            this.logger.error(`Error en la limpieza de alertas: ${error.message}`);
        } else {
            this.logger.log('Limpieza de alertas completada con éxito.');
        }
    }
}
