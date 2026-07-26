#!/usr/bin/env node
import 'dotenv/config';
import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SQL_FILE = path.join(__dirname, 'create_content_reports_table.sql');
const sql = fs.readFileSync(SQL_FILE, 'utf8');

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
        console.log('▶︎ Running reports table migration via direct Postgres connection...');
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
    } catch (err: any) {
        console.log(`   ✗ Direct pg connection failed: ${err.message}`);
    }

    try {
        if (await tryRpcExecSql()) return;
    } catch (err: any) {
        console.log(`   ✗ RPC attempt failed: ${err.message}`);
    }

    console.error(`
❌ Could not run the migration automatically. Please apply create_content_reports_table.sql manually or ensure SUPABASE_DB_URL/SUPABASE_DB_PASSWORD is set.
`);
    process.exit(1);
})();
