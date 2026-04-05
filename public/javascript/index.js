const websocket_protocol = (location.protocol === 'https:') ? 'wss:' : 'ws:';
const wsUri = `${websocket_protocol}//${location.host}/`;
const websocket = new WebSocket(wsUri);
let chat_messages = [];
const chat_container = document.getElementById('chat-container');

function insert_message(msg_data) {
    const message_data = document.createElement("p");
    message_data.style.margin = `.5rem 0`;
    message_data.style.padding = `0 1rem`;

    const timestamp = (new Date(msg_data["timestamp"])).toLocaleString();
    message_data.innerHTML = `
        <p style="font-size:.7rem; margin:0;">${timestamp}</p>
        <span style="font-weight:bold;">Anon:</span> 
        <span>${msg_data["message"]}</span>`;
    chat_container.appendChild(message_data);
    
    chat_container.scrollTop = chat_container.scrollHeight - chat_container.clientHeight;
}

// eslint-disable-next-line no-unused-vars
function sendMessage() {
    const message = document.getElementById("message").value;
    const data = JSON.stringify({
        type: "chat_send_message",
        content: message
    });

    if (message.trim().length > 0) {
        websocket.send(data);
        document.getElementById("message").value = '';
    }
}

function updateViewerCount(count) {
    document.getElementById("current-viewer-count").textContent = `Current viewers: ${count}`;
}

// handle messages
websocket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'insert_message') {
        chat_messages.push(data.payload);
        insert_message(data.payload);
    } else if (data.type === 'update_viewer_count') {
        updateViewerCount(data.payload);
    } else if (data.type === 'load_messages') { // load saved message data
        chat_messages = data.payload;
        chat_messages.forEach(msg_data => {
            insert_message(msg_data);
        });
    }
};

if (!navigator.cookieEnabled) {
    document.getElementById("notification-message").textContent = "Please enable cookies in this site to view and send in chat.";
}

