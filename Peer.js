import Connection from './Connection.js'

export default class Peer {
  constructor(lobby, id, ws){
    this.id = id ? id : Math.floor(Math.random() * Math.floor(100000))
    this.lobby = lobby
    this.connections = []
    this.ws = ws
  }

  // Create connections for each Peer already in the Lobby
  async initConnections(){
    let promises = []
    console.log("initConnections()", this.lobby)
    this.lobby.peers.forEach(peer => {
      let connection = new Connection(this, peer, this.ws)
      this.connections.push(connection)
      promises.push(connection.peerA_init())
    })
    return Promise.all(promises)
  }

  // When a Peer joins, create a new Connection, and then wait for them to send us a message
  async onPeerJoined(peer){
    let connection = new Connection(peer, this, this.ws)
    this.connections.push(connection)
    return await connection.peerB_init(peer)
  }

  // When PeerB has accepted our offer description and sends us back their response
  async onPeerBAnswer(from, desc){
    this.connections.forEach(connection => {
      if(connection.peerB.id == from.id){
        connection.onPeerBAnswer(desc)
      }
    })
  }

  // When a connected Peer sends us a ICE candidate
  async onPeerICECandidate(from, candidate){
    console.log("onPeerICECandidate: ", from)
    this.connections.forEach(connection => {
      if(connection.peerB.id == from){
        connection.onPeerBICECandidate(candidate)
      }
      if(connection.peerA.id == from){
        connection.onPeerAICECandidate(candidate)
      }
    })
  }

  // Override
  // When we have successfully opened a RTC data channel
  onConnected(peer, data_channel){
    console.log("Peer.onConnected", peer)
    return peer, data_channel
  }

  // Only want to send a few things over the websocket
  serialize(){
    return {
      id: this.id,
      connections: this.connections.map(connection => connection.serialize())
    }
  }
}
