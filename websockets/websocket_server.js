import { WebSocketServer } from 'ws';
import { sql_transaction } from '../src/controllers/sql_handler.js';
import { parseCookies } from '../src/controllers/jwt_cookies.js';
import 'dotenv/config';

function errorHandler(err) {
    console.error(err);
}

export function createWebsocket(server) {
    const wss = new WebSocketServer({noServer: true});

    server.on('upgrade', async function(req, socket, header) {
        socket.on('error', errorHandler);
        await (parseCookies(process.env.COOKIE_KEY, true))(req);

        if (req.url === '/') {
            const anon_id = req.token_cookie.anon_token;

            wss.handleUpgrade(req, socket, header, function(ws) {
                ws.anon_id = anon_id;
                ws.can_chat = !!anon_id;

                wss.emit('connection', ws, req);
            });
        }
    });

    wss.on('connection', function(ws) {
        ws.on('err', errorHandler);

        console.log("Client connected.");

        ws.on('message', async function(_data) {
            if (!ws.can_chat) return;
            const data = JSON.parse(_data);
            
            if (data.type === "chat_send_message") {
                const msg = data.content;
                if (msg.trim().length === 0) return;

                const timestamp_data = await sql_transaction('insert_message', [[ws.anon_id], [ws.anon_id, msg]]);
                const message_data = {timestamp: timestamp_data[0].timestamp, message: msg};
                updateChat(message_data);
            }
        });

        ws.on('close', function() {
            console.log("Client left.");
        });
    });

    function updateChat(message_data) {
        wss.clients.forEach(client => {
            // WebSocket.CLOSED is 3, Idk why I'm getting error 'ReferenceError: WebSocket is not defined'
            if (client.readyState === 3) return;
            client.send(JSON.stringify(
                {
                    type: 'insert_message',
                    payload: message_data
                }));
        });
    }

    function updateViewerCount(viewerCount) {
        wss.clients.forEach(client => {
            if (client.readyState === 3) return;
            client.send(JSON.stringify(
                {
                    type: 'update_viewer_count',
                    payload: viewerCount
                }));
        });
    }
}