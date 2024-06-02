const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let onlineUsers = 0;
let waitingUsers = {};

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    onlineUsers++;
    io.emit('online users', onlineUsers);
    console.log('Nowy użytkownik połączony');

    socket.on('find partner', (region) => {
        if (!waitingUsers[region]) {
            waitingUsers[region] = [];
        }

        if (waitingUsers[region].length > 0) {
            const partnerSocketId = waitingUsers[region].pop();
            const partnerSocket = io.sockets.sockets.get(partnerSocketId);

            if (partnerSocket) {
                socket.partner = partnerSocket;
                partnerSocket.partner = socket;

                socket.emit('partner found', 'Obcy');
                partnerSocket.emit('partner found', 'Obcy');
            } else {
                waitingUsers[region].push(socket.id);
            }
        } else {
            waitingUsers[region].push(socket.id);
        }
    });

    socket.on('message', (msg) => {
        if (socket.partner) {
            socket.partner.emit('message', { user: 'Obcy', text: msg });
        }
    });

    socket.on('typing', () => {
        if (socket.partner) {
            socket.partner.emit('typing');
        }
    });

    socket.on('stop typing', () => {
        if (socket.partner) {
            socket.partner.emit('stop typing');
        }
    });

    socket.on('disconnect', () => {
        onlineUsers--;
        io.emit('online users', onlineUsers);
        console.log('Użytkownik rozłączony');
        if (socket.partner) {
            socket.partner.emit('partner disconnected');
            socket.partner.partner = null;
        }

        for (let region in waitingUsers) {
            waitingUsers[region] = waitingUsers[region].filter(id => id !== socket.id);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
