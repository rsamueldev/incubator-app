import { IsNumber, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateReadingDto {
    @IsUUID()
    @IsNotEmpty()
    device_id: string;   //FK de Device para señalar a que dispositivo pertenece la lectura

    @IsNumber()
    temperature: number; //Temperatura recibida del dispositivo

    @IsNumber()
    humidity: number;    //Humedad recibida del dispositivo
}
