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
      io.to(roomId).emit(ServerEvent.MESSAGE, {msg: "A new user has joined the room!", payload: null});
    });
    socket.on(ServerEvent.PLAY + roomId, () => {
      io.to(roomId).emit(ServerEvent.PLAY + roomId, {msg: 'Play!', payload: null});
    })

    socket.on(ServerEvent.PAUSE + roomId, () => {
      io.to(roomId).emit(ServerEvent.PAUSE + roomId, {msg: 'Pause!', payload: null});
    });

    socket.on(ServerEvent.SEEK + roomId, (data: any) => {
      const seconds = data.seconds;
      io.to(roomId).emit(ServerEvent.SEEK + roomId, {msg: 'Seeking to ' + seconds + ' seconds.', payload: seconds})
    });
  });
});
