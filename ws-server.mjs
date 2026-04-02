import { WebSocketServer } from 'ws';
import { sql_query } from './modules/sql_handler.mjs';
import jwt from 'jsonwebtoken';

function errorHandler(err) {
    console.error(err);
}

function getCookie(key, req) {
    const value = `; ${req.headers.cookie}`;
    const parts = value.split(`; ${key}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

export function createWebsocket(server) {
    const wss = new WebSocketServer({noServer: true});

    server.on('upgrade', function(req, socket, header) {
        // socket.on('error', errorHandler);

        if (req.url === '/index-ws') {
            const ipToken = getCookie('ipToken', req);
            const ipData = jwt.decode(ipToken, process.env.IP_TOKEN_KEY);

            wss.handleUpgrade(req, socket, header, function(ws) {
                ws.ip = ipData.ip_address;
                wss.emit('connection', ws, req);
            });
        }
    });

    wss.on('connection', function(ws, req) {
        console.log("Client connected.")

        ws.on('err', errorHandler);

        ws.on('message', async function(_data) {
            const data = JSON.parse(_data);
            
            if (data.type === "chat_send_message") {
                const msg = data.content;
                if (msg.trim().length === 0) return;

                const timestamp_data = await sql_query('insert_message', [ws.ip, msg]);
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
            // WebSocket.CLOSED is 3, Idk why I'm getting error 'ReferenceError: WebSocket is not defined'
            if (client.readyState === 3) return;
            client.send(JSON.stringify(message_data))
        });
    }
}