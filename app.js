import express from 'express';
import { createServer } from 'node:http';

import {dirname, join} from 'node:path';
import { fileURLToPath } from 'node:url';
import {Server} from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname,'index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('chat message', (msg)=>{
    console.log('message: ', msg);
    socket.broadcast.emit('chat message', msg)
  })

  socket.on('disconnect', ()=>{
    console.log('a user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});