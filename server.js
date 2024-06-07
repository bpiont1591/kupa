const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const { body, validationResult } = require('express-validator');
const morgan = require('morgan');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let onlineUsers = 0;
let waitingUsers = {};
let lastPartners = {}; // Stores last partners for each user

// Configure Express to trust proxies
app.set('trust proxy', 1); // 1 here means trust the first proxy

// Middleware
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cookieParser());
app.use(csrf({ cookie: true }));

// Rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});
app.use(apiLimiter);

// Serve static files
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), { csrfToken: req.csrfToken() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

io.on('connection', (socket) => {
    onlineUsers++;
    io.emit('online users', onlineUsers);
    console.log('New user connected');

    // Handle partner request
    socket.on('find partner', (region) => {
        if (typeof region !== 'string' || region.trim() === '') {
            socket.emit('error', { message: 'Invalid region' });
            return;
        }

        region = region.trim();

        if (!waitingUsers[region]) {
            waitingUsers[region] = [];
        }

        let partnerSocketId = null;
        let partnerSocket = null;

        while (waitingUsers[region].length > 0) {
            partnerSocketId = waitingUsers[region].pop();
            partnerSocket = io.sockets.sockets.get(partnerSocketId);

            if (partnerSocketId !== socket.id && !(lastPartners[socket.id] && lastPartners[socket.id].includes(partnerSocketId))) {
                break;
            }

            partnerSocketId = null;
            partnerSocket = null;
        }

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
    });

    // Handle partner disconnection
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

    // Handle messages
    socket.on('message', (msg) => {
        if (typeof msg !== 'string' || msg.trim() === '') {
            socket.emit('error', { message: 'Invalid message' });
            return;
        }

        msg = msg.trim();

        if (socket.partner) {
            socket.partner.emit('message', { user: 'Obcy', text: msg });
        }
    });

    // Handle typing notifications
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

    // Handle user disconnection
    socket.on('disconnect', () => {
        onlineUsers--;
        io.emit('online users', onlineUsers);
        console.log('User disconnected');
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
    console.log(`Server running on port ${PORT}`);
});
