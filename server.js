import http from 'http';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import pug from 'pug';


// get directory name
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getStylesheet(fileName) {
    return path.join(__dirname, 'public', 'stylesheet', `${fileName}.css`)
}

function getViewsFile(fileName) {
    return path.join(__dirname, 'views', `${fileName}.pug`)
}

// for now simple read and write, no streams yet. Also blocking.

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        switch (req.url) {
            case '/':
                const index = pug.renderFile(getViewsFile('index'));
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(index);
                break;
            case '/index.css':
                const fileContent = fs.readFileSync(getStylesheet('index'), 'utf-8');
                res.writeHead(200, { 'Content-Type': 'text/css' });
                res.write(fileContent);
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
    console.log(`Server running at http://localhost:${PORT}`);
});

