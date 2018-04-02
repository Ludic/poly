import Connection from './Connection.js'

export default class Peer {
  constructor(lobby, id){
    this.id = id ? id : Math.floor(Math.random() * Math.floor(100000))
    this.lobby = lobby
    this.connections = []
  }

  async initConnections(){
    // Create connections for each peer already in the Lobby
    let promises = []
    this.lobby.peers.forEach(peer => {
      let connection = new Connection(this, peer, this.onIceCandidate)
      promises.push(connection.peerA_init())
      this.connections.push(connection)
    })

    return Promise.all(promises)
  }

  onIceCandidate(){

  }

  async onPeerJoined(peer){
    let connection = new Connection(peer, this, this.onIceCandidate)
    this.connections.push(connection)
    return await connection.peerB_init(peer)
  }

  async onPeerBAnswer(from, desc){
    console.log("from: ", from)
    console.log("this: ", this)

    this.connections.forEach(connection => {
      if(connection.peerB.id == from.id){
        console.log("\n YES")
        connection.onPeerBAnswer(desc)
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
