import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private supabaseService: SupabaseService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { user_mail, user_name, user_password } = registerDto;

        // 1. Registrar en Supabase Auth (Sistema interno)
        const { data: authData, error: authError } = await this.supabaseService
            .getClient()
            .auth.signUp({
                email: user_mail,
                password: user_password,
            });

        if (authError) {
            throw new ConflictException(authError.message);
        }

        const userId = authData.user?.id;
        if (!userId) throw new Error('Failed to get user ID from Supabase');

        // 2. Hashear contraseña antes de guardar en tabla pública
        const hashedPassword = await bcrypt.hash(user_password, 10);

        // 3. Crear el perfil en tu tabla pública 'User'
        const user = await this.usersService.create({
            user_id: userId,
            user_mail,
            user_name,
            user_password: hashedPassword,
        });

        return this.generateTokens(user.user_id, user.user_mail);
    }

    async login(loginDto: LoginDto) {
        const { user_mail, user_password } = loginDto;

        // 1. Validar credenciales con Supabase Auth
        const { data, error } = await this.supabaseService
            .getClient()
            .auth.signInWithPassword({
                email: user_mail,
                password: user_password,
            });

        if (error || !data.user || !data.user.email) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        return this.generateTokens(data.user.id, data.user.email);
    }

    async refreshToken(token: string) {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            return this.generateTokens(payload.sub, payload.email);
        } catch (e) {
            throw new UnauthorizedException('Token de refresco inválido');
        }
    }

    private generateTokens(userId: string, email: string) {
        const payload = { sub: userId, email };
        return {
            access_token: this.jwtService.sign(payload, { expiresIn: '30m' }),
            refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
        };
    }
}
