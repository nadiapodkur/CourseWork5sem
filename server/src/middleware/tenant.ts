import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import { pool } from '../db/pool.js';

/** Tenant attached to the request when it targets a forum subdomain or custom domain. */
export interface TenantContext {
  id: string;
  subdomain: string;
  schemaName: string;
  planCode: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    tenant?: TenantContext;
  }
}

/**
 * Extracts the forum subdomain from a Host header.
 * `demo.localhost:4000` -> `demo`; `localhost` -> null (platform itself).
 */
export function subdomainFromHost(host: string | undefined, baseDomain: string): string | null {
  if (!host) return null;
  const hostname = host.split(':')[0]!.toLowerCase();
  const suffix = `.${baseDomain.toLowerCase()}`;
  if (!hostname.endsWith(suffix)) return null;
  const sub = hostname.slice(0, -suffix.length);
  return sub && !sub.includes('.') ? sub : null;
}

/**
 * Resolves the tenant from the Host header (subdomain or custom domain).
 * Requests to the bare platform domain pass through with no tenant.
 * Unknown or blocked forums get 404 / 403.
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  const host = req.headers.host;
  const sub = subdomainFromHost(host, config.BASE_DOMAIN);
  const hostname = host?.split(':')[0]?.toLowerCase();

  if (!sub && hostname === config.BASE_DOMAIN) return next();

  const { rows } = await pool.query<{
    id: string;
    subdomain: string;
    schema_name: string;
    plan_code: string;
    status: string;
  }>(
    `SELECT id, subdomain, schema_name, plan_code, status
       FROM public.tenants
      WHERE subdomain = $1 OR custom_domain = $2
      LIMIT 1`,
    [sub, hostname],
  );

  const t = rows[0];
  if (!t) return res.status(404).json({ error: 'forum_not_found' });
  if (t.status === 'blocked') return res.status(403).json({ error: 'forum_blocked' });
  if (t.status !== 'active') return res.status(503).json({ error: 'forum_unavailable' });

  req.tenant = { id: t.id, subdomain: t.subdomain, schemaName: t.schema_name, planCode: t.plan_code };
  next();
}

/** Rejects requests that did not resolve to a forum. Use on forum-only routes. */
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.tenant) return res.status(400).json({ error: 'tenant_required' });
  next();
}
