import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(private supabaseService: SupabaseService) { }

    async findByEmail(email: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('User')
            .select('*')
            .eq('user_mail', email)
            .maybeSingle();

        if (error) {
            this.logger.error(`Error finding user by mail: ${error.message}`);
            return null;
        }

        return data;
    }

    async findById(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('User')
            .select('*')
            .eq('user_id', id)
            .maybeSingle();

        if (error) {
            this.logger.error(`Error finding user by id: ${error.message}`);
            return null;
        }

        return data;
    }

    async create(userData: { user_id: string, user_mail: string, user_name: string, user_password: string }) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('User')
            .insert(userData)
            .select()
            .maybeSingle();

        if (error) {
            this.logger.error(`Error creating user: ${error.message}`);
            throw new Error(`Failed to create user: ${error.message}`);
        }

        return data;
    }
}
