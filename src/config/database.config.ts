import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';

// Use provided DATABASE_URL or fallback to Supabase
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://postgres.jablizejtqpjktkqtxsz:dvmt1610666@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

export const validateDatabaseConfig = (): TypeOrmModuleOptions => {
  const logger = new Logger('DatabaseConfig');
  logger.log('🔍 Database URL:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

  return {
    type: 'postgres',
    url: DATABASE_URL,
    autoLoadEntities: true,
    synchronize: true, // TRUE para desarrollo - crea tablas automáticamente
    logging: ['error', 'warn', 'schema'],
    ssl: {
      rejectUnauthorized: false,
    },
  };
};
