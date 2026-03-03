import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LinkDeviceDto, SyncModeDto } from './dto/device.dto';

@Injectable()
export class DevicesService {
    private readonly logger = new Logger(DevicesService.name);

    constructor(private supabaseService: SupabaseService) { }

    // Vincular un dispositivo a un usuario
    async linkDevice(userId: string, linkDeviceDto: LinkDeviceDto) {
        const { device_id, device_name } = linkDeviceDto;

        // Verificar si el dispositivo ya esta registrado a alguien mas
        const { data: existing } = await this.supabaseService
            .getClient()
            .from('Device')
            .select('user_id')
            .eq('device_id', device_id)
            .maybeSingle();

        if (existing && existing.user_id && existing.user_id !== userId) {
            throw new ConflictException('Device is already linked to another user');
        }

        const { data, error } = await this.supabaseService
            .getClient()
            .from('Device')
            .upsert({
                device_id: device_id,
                user_id: userId,
                device_name: device_name
            })
            .select()
            .maybeSingle();

        if (error) {
            this.logger.error(`Error linking device: ${error.message}`);
            throw new Error(`Failed to link device: ${error.message}`);
        }

        return data;
    }

    // Obtiene los dispositivos de un usuario
    async getUserDevices(userId: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('Device')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            this.logger.error(`Error fetching user devices: ${error.message}`);
            return [];
        }

        return data;
    }

    // Actualiza el modo de sincronizacion de un dispositivo
    async syncMode(syncModeDto: SyncModeDto) {
        const { device_id, mode, current_day, turning_active } = syncModeDto;

        const updateData: any = { mode };
        if (current_day !== undefined) updateData.current_day = current_day;
        if (turning_active !== undefined) updateData.turning_active = turning_active;

        const { data, error } = await this.supabaseService
            .getClient()
            .from('Device')
            .update(updateData)
            .eq('device_id', device_id)
            .select()
            .maybeSingle();

        if (error) {
            this.logger.error(`Error syncing device mode: ${error.message}`);
            throw new NotFoundException('Device not found');
        }

        if (!data) {
            this.logger.warn(`Device ${device_id} not found in database during sync-mode update. Check if it is linked.`);
            throw new NotFoundException('Device not found');
        }

        return data;
    }

    // Obtiene un dispositivo por su id
    async findById(deviceId: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('Device')
            .select('*')
            .eq('device_id', deviceId)
            .maybeSingle();

        if (error) return null;
        return data;
    }
}
