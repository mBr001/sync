import React from 'react';
import { ClientEvent } from '../api/constants';
import io from "socket.io-client";
import queryString from 'query-string';
import axios from 'axios';
import VideoPlayer from './VideoPlayer.jsx';

interface DataFromServer {
  msg: string,
  payload: null | number,
}

class Room extends React.Component<{location: any}> {
  state = {
    socket : io.connect(ClientEvent.SERVER_URL),
    validRoomId: false,
    loaded: false,
    roomId: '',
  }

  async componentDidMount(){
    const socket = this.state.socket;
    socket.on(ClientEvent.CONNECT, () => {
       socket.emit(ClientEvent.JOIN_ROOM, roomId);
     });
    let params = queryString.parse(this.props.location.search);
    let roomId = params['roomid'];
    let res = await axios.get("http://localhost:8080/rooms?roomid=" + roomId);
    if (res && res.data){
      this.setState({
        loaded: true,
        validRoomId: true,
        roomId: params['roomid'],
      })
    }
    else {
      this.setState({
        loaded: true,
      })
    }
  }

  render() {
    let videoPlayer = this.state.loaded && this.state.validRoomId 
    ? <React.Fragment>
        <h1>Room {this.state.roomId}</h1>
        <VideoPlayer 
          socket = {this.state.socket} 
          roomId = {this.state.roomId}
          url = {"https://www.youtube.com/watch?v=LCkneiz2JPo"}
        />
      </React.Fragment> 
    : null;

    let invalidRoomId = this.state.loaded && !this.state.validRoomId 
    ? <h1>Invalid room id :(</h1> 
    : null;

    return (
    <div>
      {videoPlayer}
      {invalidRoomId}
    </div>
    );
  }
}

export default Room;