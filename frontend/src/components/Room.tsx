import React from 'react';
import YouTube from 'react-youtube';
import ReactPlayer from 'react-player';
import { ClientEvent } from '../api/constants';
import io from "socket.io-client";
import queryString from 'query-string';
import axios from 'axios';

interface DataFromServer {
  msg: string,
}

class Room extends React.Component<{location: any}> {
  state = {
    socket : io.connect(ClientEvent.SERVER_URL),
    validRoomId: false,
    finishedLoading: false,
    roomId: '',
    url: null,
    pip: false,
    playing: true,
    controls: false,
    light: false,
    volume: 0.8,
    muted: false,
    played: 0,
    loaded: 0,
    duration: 0,
    playbackRate: 1.0,
    loop: false
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
        finishedLoading: true,
        validRoomId: true,
        roomId: params['roomid'],
      })
    }
    else {
      this.setState({
        finsihedLoading: true,
      })
    }
  }

  handleOnPause = () => {
    const socket=this.state.socket;
    const roomId = this.state.roomId;
    socket.emit(ClientEvent.PAUSE + roomId, {data: "Pause!"});
  }

  handleOnPlay = () => {
     const socket = this.state.socket;
     const roomId = this.state.roomId;
     socket.emit(ClientEvent.PLAY + roomId, {data: "Play!"});
  }

  handleOnStateChange = (event: { target: any }) => {
    console.log('State has changed');
  }

  //When the video player is ready, add listeners for play, pause etc
  handleOnReady = (event: { target: any; }) => {
    const socket=this.state.socket;
    const player = event.target;
    const roomId = this.state.roomId;

    socket.on(ClientEvent.PLAY + roomId, (dataFromServer: DataFromServer) => {
      console.log(dataFromServer.msg);
      player.playVideo();
    });

    socket.on(ClientEvent.PAUSE + roomId, (dataFromServer: DataFromServer) => {
      console.log(dataFromServer.msg);
      player.pauseVideo();
    });

    socket.on(ClientEvent.MESSAGE, (dataFromServer: DataFromServer) => {
      console.log( dataFromServer.msg);
    })
  }

  render() {
    let videoPlayer = this.state.finishedLoading && this.state.validRoomId 
    ? <React.Fragment>
        <h1>Room {this.state.roomId}</h1>
        <ReactPlayer 
          controls
          url={'https://vimeo.com/56282283'} 
          onPlay={this.handleOnPlay}
          onPause={this.handleOnPause}
        />
      </React.Fragment> 
    : null;

    let invalidRoomId = this.state.finishedLoading && !this.state.validRoomId 
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

// ref={this.ref}
// className='react-player'
// width='100%'
// height='100%'
// url={'https://vimeo.com/56282283'}
// pip={false}
// playing={playing}
// controls={controls}
// light={light}
// playbackRate={playbackRate}
// volume={volume}
// muted={muted}
// onReady={() => console.log('onReady')}
// onStart={() => console.log('onStart')}
// onPlay={this.handlePlay}
// onEnablePIP={this.handleEnablePIP}
// onDisablePIP={this.handleDisablePIP}
// onPause={this.handlePause}
// onBuffer={() => console.log('onBuffer')}
// onSeek={e => console.log('onSeek', e)}
// onEnded={this.handleEnded}
// onError={e => console.log('onError', e)}
// onProgress={this.handleProgress}
// onDuration={this.handleDuration}

export default Room;