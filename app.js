require('dotenv').config();
var express = require('express');
fs = require('fs');
request = require('request');
app = express();
firebase = require("firebase");

firebase.initializeApp({
	serviceAccount: {
		projectId: process.env.PROJECT_ID,
		clientEmail: process.env.CLIENT_EMAIL,
		privateKey: process.env.PRIVATE_KEY
	},
	databaseURL: process.env.FIREBASE_URL
})

var db = firebase.database();
gameDayDetail = process.env.URL
statsRef = db.ref("stormPlayerStats")
playerRef = db.ref("players")
currentSelectedPlayersRef = db.ref("currentSelectedPlayers")
currentSelectedPlayersRef1 = db.ref("currentSelectedPlayers1")

function getStats(stormPlayers){
	var players = {}
	for(var i = 0; i < stormPlayers.length; i++){
		var player = {}
		instanceOfPlayer = stormPlayers[i]
		number = instanceOfPlayer.num
		player.rebounds = instanceOfPlayer.reb
		player.points = instanceOfPlayer.pts 
		player.assists = instanceOfPlayer.ast
		player.number = parseInt(number)
		players[number] = player
	}
	db.ref("stormPlayerStats").set(players)
}

setInterval(function(){
	request(gameDayDetail, function(error, response, body){
		if(!error){
			var json = JSON.parse(body);
			stormPlayers = json.g.hls.pstsg;
			getStats(stormPlayers);
		} else {
		console.log("We've encountered an error: " + error)
		}
	});
	console.log("RUN")
}, 1000);

function updateOurPlayerStats(playerToChange){
	var number = playerToChange.number
	playerRef.once("value", function(snapshot){
		snapshot.forEach(function(data){
			var player = data.val()
			if(number === player.number){
				player.assists = playerToChange.assists
				player.goals = playerToChange.points
				player.rebounds = playerToChange.rebounds
				playerRef.child(player.id).set(player);
			}
		})
	});
}

statsRef.on("child_changed", function(snapshot){
	var changedPost = snapshot.val();
	updateOurPlayerStats(changedPost)
})

// ref.once("value", function(snapshot) {
// 	emptyArray.push(snapshot.val());
// })

app.get('/', function(req,res){
	res.send("HURRAY");
});

app.listen(3000, function(){
	console.log('Example app listening on port 3000')
})