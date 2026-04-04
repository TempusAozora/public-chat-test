import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql_dir = path.join(__dirname, '..', 'sql');

export const sql_pool = new Pool(process.env.DB_URL ? 
    {
        connectionString: process.env.DB_URL
    } : 
    {
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DBNAME,
    }
);

const dbPool = new Pool(process.env.DB_CONNECTION_STRING ? 
    {       // production environment
        connectionString: process.env.DB_CONNECTION_STRING
    } : {   // local environment
        database: 'public-chat-test',
        user: 'chat-user',
        host: process.env.DB_HOST,
        password: process.env.DB_PASSWORD
});

export async function sql_query(filename, params) {
    try {
        const _qry = await readFile(path.join(sql_dir, 'queries', `${filename}.sql`));
        const qry = _qry.toString();

        let result;
        if (params) result = await dbPool.query(qry, params);
        else result = await dbPool.query(qry);

        return result.rows;
    } catch(e) {
        console.error(e);
    }
}

export async function sql_transaction(filename, _params, get_first_row=false) {
    const client = await dbPool.connect();
    const _transaction = await readFile(path.join(sql_dir, 'transactions', `${filename}.sql`));
    const transaction = _transaction.toString();

    let queries = transaction.split(/\s*;\s*/).slice(0, -2);
    queries.shift();

    const params = _params.map(param => param === undefined ? [] : param);

    try {
        await client.query('BEGIN;');

        for (let i=0; i<queries.length-1; i++) {
            await client.query(`${queries[i]};`, params[i]);
        }

        const result = await client.query(`${queries[queries.length-1]};`, params[queries.length-1]);
        await client.query('COMMIT;');

        if (result) return get_first_row && result.rows[0] || result.rows;
    } catch(e) {
        await client.query('ROLLBACK');
        console.error(e);
    } finally {
        client.release();
    }
}

