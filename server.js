onst express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const usedNicknames = {};
const onlineCounts = { csgo: 0, lol: 0 };

io.on('connection', (socket) => {
  socket.on('chat message', (data) => {
    if (!usedNicknames[data.category]) {
      usedNicknames[data.category] = [];
    }

    if (data.nickname.trim() !== '' && data.message.trim() !== '') {
      if (data.nickname.length <= 10) {
        usedNicknames[data.category].push(data.nickname);

        // Emit the message to all connected clients
        io.emit('chat message', data);

        // Update online count for the specific category
        io.emit('update online count', { category: data.category, count: usedNicknames[data.category].length });
      } else {
        // Send an error message to the client
        socket.emit('error message', 'Nick must be a maximum of 10 characters.');
      }
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});