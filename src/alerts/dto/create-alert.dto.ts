import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';

export enum AlertType {
    TEMP_HIGH = 'TEMP_HIGH',
    TEMP_LOW = 'TEMP_LOW',
    HUM_HIGH = 'HUM_HIGH',
    HUM_LOW = 'HUM_LOW',
    MOTOR_ACTIVE = 'MOTOR_ACTIVE',
    CRITICAL_ERROR = 'CRITICAL_ERROR',
}

export class CreateAlertDto {
    @IsUUID()
    device_id: string;

    @IsEnum(AlertType)
    type: AlertType;

    @IsString()
    message: string;
}

