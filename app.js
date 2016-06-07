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

function setCurrentPlayers(playersIn){
	var players = {};
	playerRef.once("value", function(snapshot){
		snapshot.forEach(function(data){
			var player = data.val();
			if(playersIn[player.number]){
				players[player.name] = player;
			}
		})
		currentSelectedPlayersRef.set(players);
		currentSelectedPlayersRef1.set(players);
	})
}

function getStats(stormPlayers){
	var players = {}
	for(var i = 0; i < stormPlayers.length; i++){
		var instanceOfPlayer = stormPlayers[i]
		player = {}
		if(instanceOfPlayer.court === 1){
			number = instanceOfPlayer.num
			player.goodPlays = instanceOfPlayer.reb
			player.goals = instanceOfPlayer.pts 
			player.assists = instanceOfPlayer.ast
			player.number = parseInt(number)
			players[number] = player
		}
	}
	setCurrentPlayers(players)
	db.ref("stormPlayerStats").set(players)
}

// setInterval(function(){
// 	statsRef.once("value", function(snapshot){
// 		snapshot.forEach(function(data){
// 			var player = data.val()
// 			if(player.onCourt === 1){
				
// 			}
// 		})
// 	})
// 	console.log("RUN")
// }, 1000);

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

function givePoints(difference, typeOfPoints, playerName){
	console.log(difference);
	console.log(typeOfPoints);
	console.log(playerName);
}

function compareStats(ourPlayer, wnbaPlayer){
	var oldAssists = ourPlayer.assists
	oldRebs = ourPlayer.goodPlays
	oldPts = ourPlayer.goals
	correctAsts = wnbaPlayer.assists
	correctRebs = wnbaPlayer.rebounds
	correctPts = wnbaPlayer.points
	playerName = ourPlayer.name
	if(oldAssists < correctAsts){
		var difference = oldAssists - correctAsts
		givePoints(difference, 'perAssist', playerName)
	}
	if(oldRebs < correctRebs){
		var difference = oldRebs - correctRebs
		givePoints(difference, 'perGoodPlay', playerName)
	}
	if(oldPts < correctPts){
		var difference = oldPts - correctPts
		givePoints(difference, 'perGoal', playerName)
	}
	ourPlayer.assists = wnbaPlayer.assists
	ourPlayer.goals = wnbaPlayer.points
	ourPlayer.goodPlays = wnbaPlayer.rebounds
	
	currentSelectedPlayersRef.child(playerName).set(ourPlayer)
	currentSelectedPlayersRef1.child(playerName).set(ourPlayer)
	playerRef.child(ourPlayer.id).set(ourPlayer);
}

function updateOurPlayerStats(playerToChange){
	var statToChange = null
	var number = playerToChange.number
	playerRef.once("value", function(snapshot){
		snapshot.forEach(function(data){
			var player = data.val()
			//Find Player
			if(number === player.number){
				compareStats(player, playerToChange)
			}
		})
	});
}

statsRef.on("child_changed", function(snapshot){
	//On Data Change Update Stats
	var changedPost = snapshot.val();
	updateOurPlayerStats(changedPost)
})

app.get('/', function(req,res){
	res.send("HURRAY");
});

app.listen(3000, function(){
	console.log('Example app listening on port 3000')
})