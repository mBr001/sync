import http from 'http';
import express  from 'express';
import socketIo from 'socket.io';
import router from './routes';
import  { ServerEvent }  from './constants';

const PORT = process.env.PORT || 8080;
const app = express();
const server = http.createServer(app);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/', router);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

const io = socketIo(server);
io.on(ServerEvent.CONNECT, (socket) => {
  console.log('User connected');

  socket.on(ServerEvent.JOIN_ROOM, (roomId) => {
    socket.join(roomId, () => {
      socket.to(roomId).emit(ServerEvent.MESSAGE, {msg: "A new user has joined the room!"});
    });

    socket.on(ServerEvent.PLAY, (data) => {
      socket.to(roomId).emit(ServerEvent.PLAY, {msg: 'Play!', time: data.time});
    })

    socket.on(ServerEvent.PAUSE, () => {
      socket.to(roomId).emit(ServerEvent.PAUSE, {msg: 'Pause!'});
    });
  });
});
