import http from 'http';
import path from 'path';
import fs from 'fs/promises';
import { createWebsocket } from './ws-server.mjs';
import { sql_query } from './modules/sql_handler.mjs';
import jwt from 'jsonwebtoken';

import 'dotenv/config';
import pug from 'pug';

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
    if (expiration === -1) {
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

// for now simple read and write, no streams yet. Also blocking.

const server = http.createServer(async(req, res) => {
    if (req.method === 'GET') {
        switch (req.url) {
            case '/':
                const chat_messages = await sql_query('get_message_history');
                const json_data = {
                    ip_address: req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0].trim() || req.socket.remoteAddress,
                }
                
                let ipToken = getCookie('ipToken', req);
                if (!ipToken) {
                    ipToken = jwt.sign(json_data, process.env.IP_TOKEN_KEY, {expiresIn: '1m'});
                    createCookie('ipToken', ipToken, req, res, 60);
                } else {
                    jwt.verify(ipToken, process.env.IP_TOKEN_KEY, (err) => {
                        if (!err) return;

                        console.error("Token validation failed:", err);
                        createCookie('ipToken', ipToken, req, res, 60);
                    });
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



