const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let onlineUsers = 0;
let waitingUsers = {};
let lastPartners = {}; // przechowuje ostatnich partnerów dla każdego użytkownika

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
            let partnerSocketId;
            let partnerSocket;
            do {
                partnerSocketId = waitingUsers[region].pop();
                partnerSocket = io.sockets.sockets.get(partnerSocketId);
            } while (partnerSocketId === socket.id || (lastPartners[socket.id] && lastPartners[socket.id].includes(partnerSocketId)));

            if (partnerSocket) {
                socket.partner = partnerSocket;
                partnerSocket.partner = socket;

                if (!lastPartners[socket.id]) {
                    lastPartners[socket.id] = [];
                }
                if (!lastPartners[partnerSocketId]) {
                    lastPartners[partnerSocketId] = [];
                }

                lastPartners[socket.id].push(partnerSocketId);
                lastPartners[partnerSocketId].push(socket.id);

                if (lastPartners[socket.id].length > 5) {
                    lastPartners[socket.id].shift();
                }
                if (lastPartners[partnerSocketId].length > 5) {
                    lastPartners[partnerSocketId].shift();
                }

                socket.emit('partner found', 'Obcy');
                partnerSocket.emit('partner found', 'Obcy');
            } else {
                waitingUsers[region].push(socket.id);
            }
        } else {
            waitingUsers[region].push(socket.id);
        }
    });

    socket.on('disconnect partner', () => {
        if (socket.partner) {
            socket.partner.emit('partner disconnected');
            socket.partner.partner = null;
            socket.partner = null;
        }
        for (let region in waitingUsers) {
            waitingUsers[region] = waitingUsers[region].filter(id => id !== socket.id);
        }
        const region = socket.handshake.query.region;
        socket.emit('find partner', region);
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

        delete lastPartners[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
