import http from 'http';
import path from 'path';
import fs from 'fs/promises';
import { createWebsocket } from './ws-server.mjs';
import { sql_query, sql_transaction } from './modules/sql_handler.mjs';
import jwt from 'jsonwebtoken';
import { encrypt_ip } from './modules/encryption.mjs';

import 'dotenv/config';
import pug from 'pug';
import { createHash } from 'crypto';

const hash_algo = 'sha256'
const MONTH = 2629743 // seconds

// get directory name
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getStylesheet(fileName) {
    return path.join(__dirname, 'public', 'stylesheet', `${fileName}.css`)
}

function getJSFile(fileName) {
    return path.join(__dirname, 'public', 'javascript', `${fileName}.js`)
}

function getViewsFile(fileName) {
    return path.join(__dirname, 'views', `${fileName}.pug`)
}

function getCookie(key, req) {
    const value = `; ${req.headers.cookie}`;
    const parts = value.split(`; ${key}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function createCookie(key, value, req, res, expiration_time=-1) {
    const httpOnlyFlag = 'HttpOnly';
    const secureFlag = req.socket.encrypted ? 'Secure;' : '';

    let expiration;
    if (expiration_time === -1) {
        expiration = '';
    } else {
        const now = new Date();
        const time = now.getTime();
        const expireTime = time + 1000*expiration_time;
        now.setTime(expireTime);
        expiration = 'expires=' + now.toUTCString() + ';';
    }
    
    const cookieHeader = `${key}=${value}; path=/; ${expiration} ${secureFlag} ${httpOnlyFlag}`;
    res.setHeader('Set-Cookie', cookieHeader);
}

async function extract_id_token(ip_encrypted, ip_hashed) {
    const uuid = await sql_transaction('get_anon_data', [[ip_hashed], [], [ip_encrypted, ip_hashed]]);
    
    const json_data = {anon_id: uuid[0].uuid}
    return jwt.sign(json_data, process.env.ANON_ID_KEY);
}


async function verifyToken(token,key) {
   return new Promise((resolve,reject) =>
      jwt.verify(token,key,(err,decoded) => err ? reject(false) : resolve(decoded))
   );
}

// for now simple read and write, no streams yet. Also blocking.

const server = http.createServer(async(req, res) => {
    if (req.method === 'GET') {
        switch (req.url) {
            case '/':
                const chat_messages = await sql_query('get_message_history');
                const ip = req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0].trim() || req.socket.remoteAddress
                const ip_hashed = createHash(hash_algo, process.env.HASHED_IP_KEY).update(ip).digest('base64');
                const ip_encrypted = encrypt_ip(ip);

                let anon_id = getCookie('anon_id', req);
                if (!anon_id) {
                    const ip_encrypted = encrypt_ip(ip);
                    const token = await extract_id_token(ip_encrypted, ip_hashed)
                    createCookie('anon_id', token, req, res, MONTH);
                } else {
                    const decoded = await verifyToken(anon_id, process.env.ANON_ID_KEY).catch(err => {console.error("Token validation failed")});
                    if (!decoded) {
                        const token = await extract_id_token(ip_encrypted, ip_hashed);
                        createCookie('anon_id', token, req, res, MONTH);
                    }
                }

                const index = pug.renderFile(getViewsFile('index'), {chat_messages: chat_messages});
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(index);

                break;
            case '/index.css':
                const cssFile = await fs.readFile(getStylesheet('index'), 'utf-8');
                res.writeHead(200, { 'Content-Type': 'text/css' });
                res.write(cssFile);
                break;
            case '/index.js':
                const jsFile = await fs.readFile(getJSFile('index'), 'utf-8');
                res.writeHead(200, { 'Content-Type': 'text/js' });
                res.write(jsFile);
                break;
            default:
                res.writeHead(404);
                break;
        }
    } else if (req.method === 'POST') {
        // wip
    }
    
    res.end();
});

const PORT = process.env.PORT || 3000
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at port ${PORT}`);
});

createWebsocket(server)



