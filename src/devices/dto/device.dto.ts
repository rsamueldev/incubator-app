import { IsUUID, IsString, IsInt, Min, Max, IsBoolean, IsOptional } from 'class-validator';

export class LinkDeviceDto {
    @IsUUID()
    device_id: string;

    @IsString()
    device_name: string;
}

export class SyncModeDto {
    @IsUUID()
    device_id: string;

    @IsInt()
    @Min(1)
    @Max(3)
    mode: number;

    @IsOptional()
    @IsInt()
    current_day?: number;

    @IsOptional()
    @IsBoolean()
    turning_active?: boolean;
}
