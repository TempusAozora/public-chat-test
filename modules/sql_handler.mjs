import { Pool } from 'pg';
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'path';

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
)

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
    const _qry = await readFile(path.join('sql', `${filename}.sql`));
    const qry = _qry.toString()

    let result;
    if (!!params) result = await dbPool.query(qry, params);
    else result = await dbPool.query(qry);

    return result.rows;
}

