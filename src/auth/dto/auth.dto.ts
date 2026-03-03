import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    user_mail: string;

    @IsString()
    @MinLength(3)
    user_name: string;

    @IsString()
    @MinLength(6)
    user_password: string;
}

export class LoginDto {
    @IsEmail()
    user_mail: string;

    @IsString()
    user_password: string;
}

export class RefreshTokenDto {
    @IsString()
    refresh_token: string;
}
