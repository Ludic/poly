import Poly from './Poly.js'

var onLobbyUpdated = function(lobby){
  console.log("onLobbyUpdated \n", lobby)
}

var onLobbyAdded = function(lobby){
  console.log("onLobbyAdded \n", lobby)
  let lobbies_list = document.getElementById("lobbies-list")

  lobbies_list.appendChild(document.createTextNode(lobby.id))
  lobbies_list.appendChild(document.createElement("br"))
}


var onLobbiesUpdated = function(lobbies){
  console.log("onLobbiesUpdated \n", lobbies)

  let lobby_container = document.getElementById('lobbies-container')

  // Remove all Lobbies
  document.getElementById('lobbies-list').remove()


  // Create new Lobbies
  lobbies.forEach(lobby => {
    let lobbies_list = document.createElement("div")
    lobbies_list.setAttribute("id", "lobbies-list")

    lobbies_list.appendChild(document.createTextNode(lobby.id))
    lobbies_list.appendChild(document.createElement("br"))
    document.body.appendChild(lobby_container)
  })
}

var host_button = document.getElementById("host")
host_button.onclick = async function() {
  console.log("host")
  Poly.host()
}

var join_button = document.getElementById("join")
join_button.onclick = async function() {
  console.log("join")
  Poly.join(Poly.lobbies[0])
}

var close_button = document.getElementById("close")
close_button.onclick = async function() {
  console.log("close")
  Poly.close()
}



Poly.connect(()=> {
  // Poly.watchLobbies(onLobbiesUpdated)
  Poly.onLobbiesUpdated = onLobbiesUpdated
  Poly.onLobbyAdded = onLobbyAdded
})
