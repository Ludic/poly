import Lobby from './Lobby.js'
import Peer from './Peer.js'

const log = console.log
const POLY_SERVER_URI = 'ws://localhost:3000'

class Poly {
  constructor(){
    this.lobby = null
    this.lobbies = []
    this.me = null
    this.peers = []
  }

  connect(onConnected){
    this.socket = new WebSocket(POLY_SERVER_URI)
    this.socket.addEventListener('open', onConnected)
    this.socket.addEventListener('message', this.onMessage.bind(this))
  }

  onMessage(event){
    let data = JSON.parse(event.data)
    this[data.method](event, data)
  }

  // Events
  init(event, data){
    this.lobbies = data.lobbies.map(lobby => JSON.parse(lobby))
    this.onInit()
  }

  lobbyAdded(event, data){
    log("lobbyAdded", data)
    let lobby = JSON.parse(data.lobby)
    this.lobbies.push(lobby)
    this.onLobbyAdded(lobby)
  }

  lobbyUpdated(event, data){
    this.lobby = data.lobby
    this.onLobbyUpdated(data.lobby)
  }

  // lobbiesUpdated(event, data){
  //   log("ON LOBIES UPDATED", data)
  //   this.lobbies = data.lobbies.map(lobby => JSON.parse(lobby))
  //   this.onLobbiesUpdated(this.lobbies)
  // }

  async peerJoined(event, data){
    log("peerJoined")
    let lobby_id = data.lobby_id
    let peer = data.peer
    if(lobby_id == this.lobby.id){
      let desc = await this.me.onPeerJoined(peer)

      this.socket.send(JSON.stringify({
        method: 'peerBAnswer',
        to: peer.id,
        from: this.me.serialize(),
        desc: desc,
      }))
    }
  }

  async peerBAnswer(event, data){
    let to = data.to
    let from = data.from
    let desc = data.desc
    if(to == this.me.id){
      await this.me.onPeerBAnswer(from, desc)
    }
  }

  async peerCandidate(event, data){
    log("peerCandidate: ", data)
    let to = data.to
    let from = data.from
    let candidate = data.candidate
    if(to == this.me.id){
      await this.me.onPeerICECandidate(from, candidate)
    }
  }


  // Methods
  host(){
    this.lobby = new Lobby()
    this.me = new Peer(this.lobby, null, this.socket)
    this.lobby.join(this.me)
    this.lobbies.push(this.lobby)
    this.socket.send(JSON.stringify({
      method: 'addLobby',
      lobby: this.lobby.serialize()
    }))
    this.onLobbyAdded(this.lobby)
  }

  async join(lobby){
    this.lobby = new Lobby(lobby.id, lobby.peers)
    this.me = new Peer(this.lobby, null, this.socket)
    log(this.me)

    return this.me.initConnections().then(() => {
      this.lobby.join(this.me)
      this.socket.send(JSON.stringify({
        method: 'joinLobby',
        lobby_id: this.lobby.id,
        peer: this.me.serialize(),
      }))
    })
  }

  close(){
    this.lobbies = []
    this.socket.send(JSON.stringify({
      method: 'closeLobbies',
    }))
    this.onLobbiesUpdated(this.lobbies)
  }


  // Override - Events
  onInit(){}
  onLobbyUpdated(){}
  onLobbyAdded(){}
  onLobbiesUpdated(){}

}

export default new Poly()
