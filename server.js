'use strict';

const socketIO = require('socket.io');
const express = require('express');
const path = require('path');
const app = module.exports.app = express();
const port = process.env.PORT || 3000;

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.use(express.static(__dirname));

const server = app.listen(port, () => {
  console.log("Listening on port: " + port);
});

const io = socketIO(server);

let currentRotation = 0;
let participantCount = 0;

io.on('connection', (socket) => {
  participantCount += 1;

  console.log('Client connected:', socket.id);

  socket.emit('rotationResponse', currentRotation);

  io.emit('participantCount', participantCount);

  socket.on('rotation', (rawValue) => {
    const value = Number(rawValue);

    if (!Number.isFinite(value)) return;

    currentRotation = Math.max(0, Math.min(360, value));

    socket.broadcast.emit('rotationResponse', currentRotation);
  });

  socket.on('disconnect', () => {
    participantCount = Math.max(0, participantCount - 1);
    io.emit('participantCount', participantCount);
    console.log('Client disconnected:', socket.id);
  });
});

