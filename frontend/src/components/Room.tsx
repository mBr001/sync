import React from 'react';
import YouTube from 'react-youtube';
import { ClientEvent } from '../api/constants';
import io from "socket.io-client";
import queryString from 'query-string';
import axios from 'axios';
import Lottie from 'react-lottie'
import loadingIndicator from '../lotties/loading.json';
import '../styles/Room.css';

interface DataFromServer {
  msg: string,
  time?: number
}

class Room extends React.Component<{location: any}> {
  state = {
    socket : io.connect(ClientEvent.SERVER_URL),
    validRoomId: false,
    loaded: false,
    roomId: '',
    roomName: null,
    videoId: '',
    loading: true
  }


  async componentDidMount(){
    const socket = this.state.socket;
    socket.on(ClientEvent.CONNECT, () => {
       socket.emit(ClientEvent.JOIN_ROOM, roomId);
     });
    let params = queryString.parse(this.props.location.search);
    const youtubeUrl = queryString.parse(this.props.location.state.url);
    const roomName = this.props.location.state.roomName;
    const youtubeId = youtubeUrl['https://www.youtube.com/watch?v'];
    let roomId = params['roomid'];
    let res = await axios.get("http://localhost:8080/rooms?roomid=" + roomId);
    if (res && res.data){
      setTimeout(() => {//Set delay to show cool spinner LOL!
        this.setState({
          loaded: true,
          loading: false,
          validRoomId: true,
          roomId: params['roomid'],
          roomName: roomName,
          videoId: youtubeId,
        })
      }, 2000);
    }
    else {
      this.setState({
        loaded: true,
        loading: false,
      })
    }
  }

  handleOnPause = (event: { target: any, data: number }) => {
    const socket = this.state.socket;
    socket.emit(ClientEvent.PAUSE, {data: "Pause!", });
  }

  handleOnPlay = (event: { target: any, data: number }) => {
    const socket = this.state.socket;
    const player = event.target;
    socket.emit(ClientEvent.PLAY, {data: "Play!", time: player.getCurrentTime()});
  }

  handleOnStateChange = (event: { target: any, data: number }) => {
    console.log('State has changed');
  }

  //When the video player is ready, add listeners for play, pause etc
  handleOnReady = (event: { target: any; }) => {
    const socket=this.state.socket;
    const player = event.target;
    const roomId = this.state.roomId;

    socket.on(ClientEvent.PLAY, (dataFromServer: DataFromServer) => {
      console.log(dataFromServer.msg);
      if (dataFromServer.time && Math.abs(dataFromServer.time - player.getCurrentTime()) > 0.5) {
        player.seekTo(dataFromServer.time);
      }
      player.playVideo();
    });

    socket.on(ClientEvent.PAUSE, (dataFromServer: DataFromServer) => {
      console.log(dataFromServer.msg);
      player.pauseVideo();
    });

    socket.on(ClientEvent.MESSAGE, (dataFromServer: DataFromServer) => {
      console.log( dataFromServer.msg);
    })
  }

  render() {
    const defaultOptions = {
      loop: true,
      autoplay: true,
      animationData: loadingIndicator,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
      }
    };
    let videoPlayer = this.state.loaded && this.state.validRoomId
    ? <React.Fragment>
        <h1 style={{color: "white"}}>{this.state.roomName || ("Room" + this.state.roomId)}</h1>
        <YouTube
          videoId={this.state.videoId}
          onReady={this.handleOnReady}
          onPlay={this.handleOnPlay}
          onStateChange={this.handleOnStateChange}
          onPause={this.handleOnPause}
        />
      </React.Fragment>
    : null;

    let invalidRoomId = this.state.loaded && !this.state.validRoomId
    ? <h1 style={{color: "white"}}>Invalid room id :(</h1>
    : null;

    let showLoadingIndicator = !this.state.loaded ?
    <Lottie options={defaultOptions}
    height={400}
    width={400} />: null ;

    return (
    <div className="container">
      {videoPlayer}
      {invalidRoomId}
      {showLoadingIndicator}
    </div>
    );
  }
}

export default Room;
