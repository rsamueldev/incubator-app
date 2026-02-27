import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: Redis;

    constructor(private configService: ConfigService) { }

    // Inicializa la conexion con Redis
    onModuleInit() {
        const host = this.configService.get<string>('REDIS_HOST', 'localhost');
        const port = this.configService.get<number>('REDIS_PORT', 6379);
        const password = this.configService.get<string>('REDIS_PASSWORD');

        this.client = new Redis({
            host,
            port,
            password,
            tls: host !== 'localhost' ? {} : undefined,
            retryStrategy: (times) => {
                return Math.min(times * 50, 2000);
            },
        });


        this.client.on('connect', () => {
            this.logger.log('Redis connected successfully');
        });

        this.client.on('error', (err) => {
            this.logger.error('Redis connection error', err);
        });
    }

    // Cierra la conexion con Redis
    onModuleDestroy() {
        this.client.disconnect();
    }

    // Guarda un valor en Redis
    async set(key: string, value: any, ttl?: number): Promise<void> {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttl) {
            await this.client.set(key, stringValue, 'EX', ttl);
        } else {
            await this.client.set(key, stringValue);
        }
    }

    // Obtiene un valor de Redis
    async get<T>(key: string): Promise<T | null> {
        const value = await this.client.get(key);
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch {
            return value as unknown as T;
        }
    }
}
