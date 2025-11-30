import 'dotenv/config'
import { DataSource } from 'typeorm'

// Use provided DATABASE_URL or fallback to Supabase
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://postgres.jablizejtqpjktkqtxsz:dvmt1610666@aws-0-us-west-2.pooler.supabase.com:5432/postgres';

// mask password
const masked = DATABASE_URL.replace(/:([^:@]+)@/, ':****@')
console.log('🔌 Using DATABASE_URL:', masked)

const AppDataSource = new DataSource({
  type: 'postgres',
  url: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  logging: ['error', 'warn', 'schema'],
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
})

export default AppDataSource
