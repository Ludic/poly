import Connection from './Connection.js'

export default class Peer {
  constructor(lobby, id, ws){
    this.id = id ? id : Math.floor(Math.random() * Math.floor(100000))
    this.lobby = lobby
    this.connections = []
    this.ws = ws
  }

  async initConnections(){
    // Create connections for each peer already in the Lobby
    let promises = []
    this.lobby.peers.forEach(peer => {
      let connection = new Connection(this, peer, this.ws)
      promises.push(connection.peerA_init())
      this.connections.push(connection)
    })

    return Promise.all(promises)
  }

  async onPeerJoined(peer){
    let connection = new Connection(peer, this, this.ws)
    this.connections.push(connection)
    return await connection.peerB_init(peer)
  }

  async onPeerBAnswer(from, desc){
    this.connections.forEach(connection => {
      if(connection.peerB.id == from.id){
        connection.onPeerBAnswer(desc)
      }
    })
  }

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

  serialize(){
    return {
      id: this.id,
      connections: this.connections.map(connection => connection.serialize())
    }
  }
}
