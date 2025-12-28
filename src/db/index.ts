// import { drizzle } from 'drizzle-orm/neon-http';
// import 'dotenv/config';

// const db = drizzle(process.env.DATABASE_URL);


import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export * from "./schema";