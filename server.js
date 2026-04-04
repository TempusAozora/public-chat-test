import http from 'http';
import express from 'express';
import index from './src/routes/index.js';
import { createWebsocket } from './websockets/websocket_server.js';

const app = express();
app.set('view engine', 'pug');
app.set('views', './src/views');

app.use(express.static('public'));

// routes
app.use('/', index);

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at port ${PORT}`);
});

createWebsocket(server);



