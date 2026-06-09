import 'dotenv/config'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

let connectionString = process.env.DATABASE_URL
if (connectionString?.includes('postgres:postgres@supabase_db_')) {
  const url = URL.parse(connectionString)!
  url.hostname = url.hostname.split('_')[1] ?? '';
  connectionString = url.href
}

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString as string, { prepare: false })
export const db = drizzle(client);