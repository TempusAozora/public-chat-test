const websocket_protocol = (location.protocol === 'https:') ? 'wss:' : 'ws:';
const wsUri = `${websocket_protocol}//${location.host}/`;
const websocket = new WebSocket(wsUri);
const chat_messages = window.CHAT_MESSAGES_DATA;
const chat_container = document.getElementById('chat-container');

function insert_message(msg_data) {
    const message_data = document.createElement("p");
    const timestamp = (new Date(msg_data["timestamp"])).toLocaleString();
    message_data.innerHTML = `${timestamp} <span style="font-weight:bold;">Anonymous:</span> ${msg_data["message"]}`;
    chat_container.appendChild(message_data);
    
    chat_container.scrollTop = chat_container.scrollHeight - chat_container.clientHeight;
}

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
    }
};

// load saved message data
chat_messages.forEach(msg_data => {
    insert_message(msg_data);
});