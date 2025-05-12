import express from 'express';
import { createServer } from 'node:http';

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import cors from 'cors';
import util from 'util';

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('a user connected');
    io.emit('rooms', getRooms('connected'));

    socket.on('disconnect', () => {
        console.log('a user disconnected');
    });

    socket.on('new room', async function (room) {
        console.log(`A new room is created: ${room}`);
        socket.room = room;
        await socket.join(room);
        setImmediate(() => {
            io.emit('rooms', getRooms('new room'));
        });
    });

    socket.on('join room', function (room) {
        console.log(`A new user joined room: ${room}`);
        socket.room = room;
        socket.join(room);
        io.emit('rooms', getRooms('joined room'));
    });

    socket.on('chat message', (data) => {
        io.in(data.room).emit('chat message', `${data.name}: ${data.message}`);
    });

    socket.on('set username', function (name) {
        console.log(`username set to ${name}(${socket.id})`);
        socket.username = name;
    });
});

server.listen(3001, () => {
    console.log('Server is running on port 3001');
});

function getRooms(msg) {
    const rooms = io.sockets.adapter.rooms;
    const sockets = io.sockets.sockets;

    // console.log('Rooms: ', rooms);
    // console.log('sockets: ', sockets);

    const list = {};

    for (let [roomId, socketIds] of rooms) {
        // Skip if roomId is also a socket ID (Socket.IO creates a private room per socket)
        if (sockets.has(roomId)) continue;

        const usernames = [];
        let roomName = '';

        for (let socketId of socketIds) {
            const socket = sockets.get(socketId);
            if (!socket || !socket.username || !socket.room) continue;

            usernames.push(socket.username);
            if (!roomName) roomName = socket.room;
        }

        if (roomName) {
            console.log('has roomName: ', roomName);
            list[roomName] = usernames;
        }
    }

    console.log(`getRooms: ${msg} >>`, list);
    return list;
}
