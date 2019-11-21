import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import { ClientEvent } from '../api/constants';
import io from "socket.io-client";
import queryString from 'query-string';
import axios from 'axios';
import { hot } from 'react-hot-loader'
import screenfull from 'screenfull'
import LinearProgress from '@material-ui/core/LinearProgress';

import '../styles/reset.css'
import '../styles/defaults.css'
import '../styles/Room.css'

import ReactPlayer from 'react-player'

class App extends Component {
  state = {
    socket : io.connect(ClientEvent.SERVER_URL),
    validRoomId: false,
    finishedLoading: false,
    roomId: '',
    url: "https://www.youtube.com/watch?v=LCkneiz2JPo",
    pip: false,
    playing: true,
    controls: false,
    light: false,
    volume: 0.8,
    muted: false,
    seeking: false,
    played: 0,
    loaded: 0,
    duration: 0,
    playbackRate: 1.0,
    loop: false,
  }

  async componentDidMount(){
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

  load = url => {
    this.setState({
      url,
      played: 0,
      loaded: 0,
      pip: false
    })
  }

  handlePlayPause = () => {
    this.setState({ playing: !this.state.playing })
  }

  handleStop = () => {
    this.setState({ url: null, playing: false })
  }

  handleToggleControls = () => {
    const url = this.state.url
    this.setState({
      controls: !this.state.controls,
      url: null
    }, () => this.load(url))
  }

  handleToggleLoop = () => {
    this.setState({ loop: !this.state.loop })
  }

  handleVolumeChange = e => {
    this.setState({ volume: parseFloat(e.target.value) })
  }

  handleToggleMuted = () => {
    this.setState({ muted: !this.state.muted })
  }

  handleSetPlaybackRate = e => {
    this.setState({ playbackRate: parseFloat(e.target.value) })
  }

  handlePlay = () => {
    console.log('onPlay')
    this.setState({ playing: true });
    this.state.socket.emit(ClientEvent.PAUSE, {data: "Pause!"});
  }

  handlePause = () => {
    console.log('onPause')
    this.setState({ playing: false });
    this.state.socket.emit(ClientEvent.PLAY, {data: "Play!"});
  }

  handleSeekMouseDown = e => {
    this.setState({ seeking: true });
  }

  handleSeekChange = e => {
    this.setState({ played: parseFloat(e.target.value) })
    // TODO: add the socket function call for seeking
  }

  handleSeekMouseUp = e => {
    this.setState({ seeking: false })
    this.player.seekTo(parseFloat(e.target.value))
  }

  handleProgress = state => {
    console.log('onProgress', state)
    // We only want to update time slider if we are not currently seeking
    if (!this.state.seeking) {
      this.setState(state)
    }
  }

  handleEnded = () => {
    console.log('onEnded')
    this.setState({ playing: this.state.loop })
  }

  handleDuration = duration => {
    console.log('onDuration', duration)
    this.setState({ duration })
  }

  handleClickFullscreen = () => {
    screenfull.request(findDOMNode(this.player))
  }

  //When the video player is ready, add listeners for play, pause etc
  handleReady = (event) => {
    const socket=this.state.socket;
    const player = event.target;

    socket.on(ClientEvent.PLAY, (dataFromServer) => {
      console.log(dataFromServer);
      player.playVideo();
    });

    socket.on(ClientEvent.PAUSE, (dataFromServer) => {
      console.log(dataFromServer);
      player.pauseVideo();
    });
  }

  ref = (player) => {
    this.player = player
  }

  render () {
    const { url, playing, controls, light, volume, muted, loop, played, loaded, duration, playbackRate, pip } = this.state

    return (
      <div className='app'>
        <section className='section'>
          <h1>ReactPlayer Demo</h1>
          <input ref={input => { this.urlInput = input }} type='text' placeholder='Enter URL' />
          <button onClick={() => this.setState({ url: this.urlInput.value })}>Load</button>
        </section>
        <section className='section'>
          <div className='player-wrapper'>
            <ReactPlayer
              ref={this.ref}
              className='react-player'
              width='100%'
              height='100%'
              url={url}
              playing={playing}
              controls={controls}
              loop={loop}
              playbackRate={playbackRate}
              volume={volume}
              muted={muted}
              onReady={this.handleReady}
              onStart={() => console.log('onStart')}
              onPlay={this.handlePlay}
              onPause={this.handlePause}
              onBuffer={() => console.log('onBuffer')}
              onSeek={e => console.log('onSeek', e)}
              onEnded={this.handleEnded}
              onError={e => console.log('onError', e)}
              onProgress={this.handleProgress}
              onDuration={this.handleDuration}
            />
          </div>
          <table>
            <tbody>
              <tr>
                <th>Controls</th>
                <td>
                  <button onClick={this.handleStop}>Stop</button>
                  <button onClick={this.handlePlayPause}>{playing ? 'Pause' : 'Play'}</button>
                  <button onClick={this.handleClickFullscreen}>Fullscreen</button>
                  {light &&
                    <button onClick={() => this.player.showPreview()}>Show preview</button>}
                  {ReactPlayer.canEnablePIP(url) &&
                    <button onClick={this.handleTogglePIP}>{pip ? 'Disable PiP' : 'Enable PiP'}</button>}
                </td>
              </tr>
              <tr>
                <th>Speed</th>
                <td>
                  <button onClick={this.handleSetPlaybackRate} value={1}>1x</button>
                  <button onClick={this.handleSetPlaybackRate} value={1.5}>1.5x</button>
                  <button onClick={this.handleSetPlaybackRate} value={2}>2x</button>
                </td>
              </tr>
              <tr>
                <th>Seek</th>
                <td>
                  <input
                    type='range' min={0} max={1} step='any'
                    value={played}
                    onMouseDown={this.handleSeekMouseDown}
                    onChange={this.handleSeekChange}
                    onMouseUp={this.handleSeekMouseUp}
                  />
                </td>
              </tr>
              <tr>
                <th>Volume</th>
                <td>
                  <input type='range' min={0} max={1} step='any' value={volume} onChange={this.handleVolumeChange} />
                </td>
              </tr>
              <tr>
                <th>
                  <label htmlFor='controls'>Controls</label>
                </th>
                <td>
                  <input id='controls' type='checkbox' checked={controls} onChange={this.handleToggleControls} />
                  <em>&nbsp; Requires player reload</em>
                </td>
              </tr>
              <tr>
                <th>
                  <label htmlFor='muted'>Muted</label>
                </th>
                <td>
                  <input id='muted' type='checkbox' checked={muted} onChange={this.handleToggleMuted} />
                </td>
              </tr>
              <tr>
                <th>
                  <label htmlFor='loop'>Loop</label>
                </th>
                <td>
                  <input id='loop' type='checkbox' checked={loop} onChange={this.handleToggleLoop} />
                </td>
              </tr>
              <tr>
                <th>Played</th>
                <td><progress max={1} value={played} /></td>
              </tr>
              <tr>
                <th>Loaded</th>
                {/* <td><progress max={1} value={loaded} /></td> */}
                <LinearProgress variant="determinate" value={loaded * 100}/>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    )
  }
}

export default hot(module)(App)