const log = console.log

export default class Connection {
  constructor(peerA, peerB, ws){
    this.peerA = peerA
    this.peerB = peerB
    this.ws = ws
    this.A = {}
    this.B = {}
    this.servers = null
    this.dataChannelParams = {
      ordered: false
    }
  }


  ////////////
  // Peer A //
  ////////////
  async peerA_init(){
    // Create a RTCPeerConnection for peerA
    this.A.rtc = new RTCPeerConnection(this.servers)

    // Setup ICE Listeners
    this.A.rtc.onicecandidate = this.peerA_onIceCandidate.bind(this)
    console.log('Created a RTC: ', this.A.rtc)

    // Create a DataChannel for peerA
    this.A.rtc.ondatachannel = this.peerA_onDataChannel.bind(this)
    this.A.dc = this.A.rtc.createDataChannel("dc", this.dataChannelParams)
    this.A.dc.binaryType = 'arraybuffer'

    // Setup DataChannel Listeners
    this.A.dc.onopen = this.peerA_onOpen.bind(this)
    this.A.dc.onclose = this.peerA_onClose.bind(this)
    this.A.dc.onmessage = this.peerA_onMessage.bind(this)

    console.log('Created a DataChannel', this.A.dc)

    // Once we've set the localDescription, return
    return new Promise((resolve, reject) => {

      // Create an Offer for peerA
      this.A.rtc.createOffer().then(offer => {
        this.A.rtc.setLocalDescription(offer).then(()=>{
          console.log("local description set: ", this.A.rtc.localDescription)
          resolve(this.A.rtc.localDescription)
        })
      }, error => {
        console.error("Error creating an offer", error)
      })
    })
  }

  peerA_onOpen(event){
    log("peerA_onOpen: ", event)
    this.peerA.onConnected(this.peerB, this.A.dc)
    // this.A.dc.send("FUCK")
  }

  peerA_onClose(event){
    log("peerA_onClose: ", event)
  }

  peerA_onMessage(event){
    log("peerA_onMessage: ", event)
  }

  peerA_onDataChannel(event){
    log("peerA_onDataChannel: ", event)
    this.A.dc.send("AHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH")
  }

  onPeerBAnswer(desc) {
    console.log("setting peerA remote description")
    return this.A.rtc.setRemoteDescription(desc).catch(error => {
      console.error(error)
    })
  }

  onPeerBICECandidate(candidate) {
    console.log("onPeerBICECandidate")
    return this.A.rtc.addIceCandidate(candidate).catch(error => {
      console.error(error)
    })
  }


  peerA_onIceCandidate(event) {
    log("peerA_onIceCandidate: ", event)
    if(event.candidate){
      this.ws.send(JSON.stringify({
        method: 'peerCandidate',
        from: this.peerA.id,
        to: this.peerB.id,
        candidate: event.candidate
      }))
    }
  }

  ////////////
  // Peer B //
  ////////////
  async peerB_init(){
    // Create a RTCPeerConnection for peerB
    this.B.rtc = new RTCPeerConnection(this.servers)

    // Setup DataChannel Listeners
    this.B.rtc.ondatachannel = this.peerB_onDataChannel.bind(this)

    // Setup ICE Listeners
    this.B.rtc.onicecandidate = this.peerB_onIceCandidate.bind(this)
    console.log('Created a RTC: ', this.B.rtc)

    // Find the correct connection
    let description = null
    this.peerA.connections.forEach(connection => {
      if(connection.b.peer_id == this.peerB.id){
        description = connection.a.localDescription
      }
    })
    console.log("setting peerB remote description: ", description)
    await this.B.rtc.setRemoteDescription(description)
    let desc = await this.B.rtc.createAnswer()
    console.log("setting peerB local description: ", desc)
    this.B.rtc.setLocalDescription(desc)

    return desc
  }

  peerB_onOpen(event){
    log("peerB_onOpen: ", event)
  }

  peerB_onClose(event){
    log("peerB_onClose: ", event)
  }

  peerB_onMessage(event){
    log("peerB_onMessage: ", event)
  }

  peerB_onDataChannel(event){
    log("GOT A FUCKING DATA CHANNEL!", event)
    this.B.dc = event.channel
    this.B.dc.onmessage = this.peerB_onMessage.bind(this)
    this.peerB.onConnected(this.peerA, this.B.dc)
    this.B.dc.send("FUCK you!!!!!!!!!!!!")
  }

  peerB_onIceCandidate(event) {
    console.log("peerB_onIceCandidate: ", event)
    if(event.candidate){
      this.ws.send(JSON.stringify({
        method: 'peerCandidate',
        from: this.peerB.id,
        to: this.peerA.id,
        candidate: event.candidate
      }))
    }
  }

  onPeerAICECandidate(candidate) {
    console.log("onPeerAICECandidate")
    return this.B.rtc.addIceCandidate(candidate).catch(error => {
      console.error(error)
    })
  }

  serialize(){
    return {
      a: {
        peer_id: this.peerA.id,
        localDescription: this.A.rtc ? this.A.rtc.localDescription : null,
       },
      b: {
        peer_id: this.peerB.id,
        localDescription: this.B.rtc ? this.B.localDescription : null,
       }
    }
  }

}
