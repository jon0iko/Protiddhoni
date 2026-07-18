#!/usr/bin/env node
import 'dotenv/config';
import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';
/**
 * Runner for a migration file in this directory.
 *
 *   pnpm migrate <file.sql>     (defaults to create_quiz_tables.sql)
 *
 * Tries three paths in order:
 *   1. `pg` direct connection via SUPABASE_DB_URL (preferred)
 *   2. `pg` via SUPABASE_DB_PASSWORD + project-ref derived from SUPABASE_URL
 *   3. Supabase RPC `exec_sql(query text)` if pre-installed in the project
 *
 * If none work, exits non-zero with instructions for manual application.
 */

import fs from 'fs';
import path from 'path';

const requested = process.argv[2] || 'create_quiz_tables.sql';
// Accept either a bare filename in this directory or an explicit path.
const SQL_FILE = path.isAbsolute(requested) || requested.includes(path.sep)
    ? path.resolve(requested)
    : path.join(__dirname, requested);

if (!fs.existsSync(SQL_FILE)) {
    console.error(`❌ No such migration file: ${SQL_FILE}`);
    process.exit(1);
}

const sql = fs.readFileSync(SQL_FILE, 'utf8');
console.log(`▶︎ Migration: ${path.basename(SQL_FILE)}`);

async function tryDirectPg() {
    let connectionString = process.env.SUPABASE_DB_URL;
    if (!connectionString && process.env.SUPABASE_DB_PASSWORD && process.env.SUPABASE_URL) {
        const projectRef = new URL(process.env.SUPABASE_URL).hostname.split('.')[0];
        const region = process.env.SUPABASE_DB_REGION || 'us-east-1';
        connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    }
    if (!connectionString) return false;

    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
        console.log('▶︎ Running migration via direct Postgres connection...');
        await client.query(sql);
        console.log('✅ Migration applied via pg.');
        return true;
    } finally {
        await client.end();
    }
}

async function tryRpcExecSql() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return false;
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log('▶︎ Trying Supabase RPC exec_sql...');
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
        console.log(`   ✗ exec_sql RPC failed: ${error.message}`);
        return false;
    }
    console.log('✅ Migration applied via exec_sql RPC.');
    return true;
}

(async () => {
    try {
        if (await tryDirectPg()) return;
    } catch (err) {
        console.log(`   ✗ Direct pg connection failed: ${err.message}`);
    }

    try {
        if (await tryRpcExecSql()) return;
    } catch (err) {
        console.log(`   ✗ RPC attempt failed: ${err.message}`);
    }

    console.error(`
❌ Could not run the migration automatically.

Pick one of these options:

  Option A — Run via Supabase SQL Editor (no extra setup):
    1. Open https://supabase.com/dashboard/project/<your-project>/sql/new
    2. Paste the contents of:
       ${SQL_FILE}
    3. Click "Run".

  Option B — Run via this script with a direct DB password:
    1. In Supabase dashboard → Project Settings → Database → Connection string
       copy the "URI" form (the one that already includes [YOUR-PASSWORD]).
    2. export SUPABASE_DB_URL="postgresql://postgres.<ref>:<password>@...pooler.supabase.com:6543/postgres"
    3. pnpm --dir backend migrate ${path.basename(SQL_FILE)}
`);
    process.exit(1);
})();
