import { WebSocketServer } from 'ws';
import { sql_transaction } from '../src/controllers/sql_handler.js';
import { parseCookies } from '../src/controllers/jwt_cookies.js';
import { sql_query } from '../src/controllers/sql_handler.js';
import 'dotenv/config';

function errorHandler(err) {
    console.error(err);
}

const viewers = new Map();

export function getViewerCount() {
    return viewers.size;
}

export function createWebsocket(server) {
   
    const wss = new WebSocketServer({noServer: true});

    server.on('upgrade', async function(req, socket, header) {
        socket.on('error', errorHandler);

        if (req.url === '/') {
            await (parseCookies(process.env.COOKIE_KEY, true))(req);
            const anon_id = req.token_cookie.anon_token;

            wss.handleUpgrade(req, socket, header, function(ws) {
                ws.anon_id = anon_id;
                ws.can_chat = !!anon_id;

                wss.emit('connection', ws, req);
            });
        }
    });

    wss.on('connection', async function(ws) {
        ws.on('err', errorHandler);

        console.log("Client connected.");
        if (ws.can_chat) {
            viewers.set(ws.anon_id, viewers.get(ws.anon_id)+1 || 1);
            updateViewerCount();
        }

        const chat_messages = await sql_query('get_message_history');
        ws.send(JSON.stringify({
            type: 'load_messages',
            payload: chat_messages.map(obj => {
                return {
                    timestamp: obj.timestamp, 
                    message: ws.can_chat? obj.message : '*'.repeat(obj.message.length)
                };
            })
        }));

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
            if (ws.can_chat) {
                if (viewers.get(ws.anon_id) === 1) viewers.delete(ws.anon_id);
                else viewers.set(ws.anon_id, viewers.get(ws.anon_id)-1);
                updateViewerCount();
            }
        });
    });

    function updateChat(message_data) {
        wss.clients.forEach(client => {
            // WebSocket.CLOSED is 3, Idk why I'm getting error 'ReferenceError: WebSocket is not defined'
            if (client.readyState === 3) return;
            const msg = client.can_chat? message_data.message : '*'.repeat(message_data.message.length);
            client.send(JSON.stringify(
                {
                    type: 'insert_message',
                    payload: {timestamp: message_data.timestamp,  message: msg}
                }));
        });
    }

    function updateViewerCount() {
        wss.clients.forEach(client => {
            if (client.readyState === 3) return;
            client.send(JSON.stringify(
                {
                    type: 'update_viewer_count',
                    payload: viewers.size
                }));
        });
    }
}