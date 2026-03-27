import http from 'http';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import pug from 'pug';

// get directory name
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// compiled views files
function sendFile(res, filePath, code=200) {
    res.writeHead(code, { 'Content-Type': 'text/html' });
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
    res.end();
}

function getPublicFile(str) {
    return path.join(__dirname, 'public', str);
}

const server = http.createServer((req, res) => {
    if (req.url === '/' && req.method === 'GET') {
        sendFile(res, getPublicFile('index.html'));
    } else if (req.url === '/test' && req.method === 'GET') {
        const index = pug.renderFile(path.join(__dirname, 'views', 'index.pug'), {
            ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(index);
    } else {
        sendFile(res, getPublicFile('not_found.html'), 404);
    }
});

const PORT = process.env.PORT || 3000
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

