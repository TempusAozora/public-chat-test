import { WebSocketServer } from 'ws';
import { sql_query } from './modules/sql_handler.mjs';

function errorHandler(err) {
    console.error(err);
}

export function createWebsocket(server) {
    const wss = new WebSocketServer({noServer: true});

    server.on('upgrade', function(req, socket, header) {
        // no validation yet
        // socket.on('error', errorHandler);
        if (req.url === '/index-ws') {
            wss.handleUpgrade(req, socket, header, function(ws) {
                wss.emit('connection', ws, req);
            });
        }
    });

    wss.on('connection', function(ws, req) {
        console.log("Client connected.")

        ws.on('err', errorHandler);
        console.log("WEBSOCKET IP CHECK FOR DEBUGGING:", req.socket.remoteAddress);

        ws.on('message', async function(_data) {
            const data = JSON.parse(_data);
            const ip = !!req.headers['x-forwarded-for'] ? 
                req.headers['x-forwarded-for'].split(/\s*,\s*/)[0] :
                req.socket.remoteAddress;
            
            if (data.type === "chat_send_message") {
                const msg = data.content;
                if (msg.trim().length === 0) return;

                const timestamp_data = await sql_query('insert_message', [ip, msg]);
                const message_data = {timestamp: timestamp_data[0].timestamp, message: msg};
                update_chat(message_data);
            }
        });

        ws.on('close', function() {
            console.log("Client left.")
        })
    })

    function update_chat(message_data) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.CLOSED) return;
            client.send(JSON.stringify(message_data))
        });
    }
}