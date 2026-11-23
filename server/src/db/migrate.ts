import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type pg from 'pg';
import { pool, withTransaction } from './pool.js';
import { assertTenantSchema } from './tenant.js';

/**
 * Migration runner.
 *  - `migrations/platform/*.sql` are applied to the `public` schema (plans, tenants, platform users).
 *  - `migrations/tenant/*.sql` are applied to every tenant schema.
 * Each schema tracks its own applied files in `<schema>.schema_migrations`.
 * A failed migration in one tenant schema is logged and does not stop the others (ТЗ, п. 4.2).
 */

const here = path.dirname(fileURLToPath(import.meta.url));
// Works both from src/ (tsx) and dist/ (compiled): migrations live in server/migrations.
const MIGRATIONS_DIR = path.resolve(here, '..', '..', 'migrations');

async function listSql(dir: string): Promise<string[]> {
  const files = await readdir(path.join(MIGRATIONS_DIR, dir));
  return files.filter((f) => f.endsWith('.sql')).sort();
}

/** Applies pending migrations from `dir` to `schema`. Returns the number of files applied. */
export async function migrateSchema(schema: string, dir: 'platform' | 'tenant'): Promise<number> {
  if (schema !== 'public') assertTenantSchema(schema);
  const files = await listSql(dir);

  return withTransaction(async (client: pg.PoolClient) => {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await client.query(`SET LOCAL search_path TO "${schema}", public`);
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
    );
    const { rows } = await client.query<{ name: string }>('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name));

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(path.join(MIGRATIONS_DIR, dir, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      count++;
    }
    return count;
  });
}

/** Migrates the platform schema, then every tenant schema listed in `public.tenants`. */
export async function migrateAll(): Promise<{ failed: string[] }> {
  const platformApplied = await migrateSchema('public', 'platform');
  console.log(`public: ${platformApplied} migration(s) applied`);

  const { rows } = await pool.query<{ schema_name: string }>(
    'SELECT schema_name FROM tenants ORDER BY created_at',
  );

  const failed: string[] = [];
  for (const { schema_name } of rows) {
    try {
      const n = await migrateSchema(schema_name, 'tenant');
      console.log(`${schema_name}: ${n} migration(s) applied`);
    } catch (err) {
      failed.push(schema_name);
      console.error(`${schema_name}: migration failed`, err);
    }
  }
  return { failed };
}

// Run directly: `npm run migrate`
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  migrateAll()
    .then(({ failed }) => {
      if (failed.length) console.warn(`Failed schemas: ${failed.join(', ')}`);
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
