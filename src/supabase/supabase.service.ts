import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
    private readonly logger = new Logger(SupabaseService.name);
    private client: SupabaseClient;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            this.logger.error('CRITICAL: SUPABASE_URL or SUPABASE_KEY is not defined');
            throw new Error('Supabase configuration missing');
        }

        this.client = createClient(supabaseUrl, supabaseKey);
        const host = new URL(supabaseUrl).hostname;
        this.logger.log(`Supabase client initialized for host: ${host}`);
    }

    getClient(): SupabaseClient {
        if (!this.client) {
            throw new Error('Supabase client not initialized. Check environment variables.');
        }
        return this.client;
    }
}
