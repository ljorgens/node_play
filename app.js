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
todayScore = db.ref("todayScore")
tvDelay = 40000

function setCurrentPlayers(playersIn, todayScore){
	var players = {};
	var playersInvolved = false
	playerRef.once("value", function(snapshot){
		snapshot.forEach(function(data){
			var player = data.val();
			if(playersIn[player.number]){
				players[player.name] = player;
				playersInvolved = true
			}
		})
		if(playersInvolved){
			currentSelectedPlayersRef.set(players);
			currentSelectedPlayersRef1.set(players);
		}
	})
}

function getStats(stormPlayers){
	var players = {}
	for(var i = 0; i < stormPlayers.length; i++){
		var instanceOfPlayer = stormPlayers[i]
		player = {}
		if(instanceOfPlayer.court === 1){
			number = parseInt(instanceOfPlayer.num)
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

function pingWebsite(gameDayDetail){
	var stormPlayers = null
	request(gameDayDetail, function(error, response, body){
		if(!error){
			var json = JSON.parse(body);
			if(json.g.hls.tid === 1611661328){
				stormPlayers = json.g.hls.pstsg;
			} else {
				stormPlayers = json.g.vls.pstsg;
			}
			if(stormPlayers){
				getStats(stormPlayers);
			}
		} else {
		console.log("We've encountered an error: " + error)
		}
	});
}

var time = 1000
function timeout(){
	setTimeout(function(){
		todayScore.once("value", function(snapshot){
			var todayScore = snapshot.val();
			if(todayScore['gameToday']){
				time = 1000
				var gid = todayScore['gid'];
				gameDayDetail = "http://data.wnba.com/data/1m/v2015/json/mobile_teams/wnba/2016/scores/gamedetail/"+ gid +"_gamedetail.json";
				pingWebsite(gameDayDetail);
			} else {
				time = 100000
			}
		})
		timeout();
	}, time);
};
timeout();

function givePointsToUsers(playerName, amountToIncrease){
	console.log("here")
	db.ref('userCurrentPickedPlayer').orderByChild('playerID').equalTo(playerName).once("value", function(snapshot){
		snapshot.forEach(function(data){
			var userTemp = data.key;
			var userPointsRef = db.ref('userPoints/' + userTemp + '/points');
			var userLevelRef = db.ref('userLevel/' + userTemp + '/totalPoints');
			var userCurrentPointsRef = db.ref('currentGameUserPoints/' + userTemp)
			userPointsRef.transaction(function(currentPoints) {
				return currentPoints + amountToIncrease;
			}, function(error){
				if(error){
					console.log(error)
				}
			});
			userLevelRef.transaction(function(currentLevelPoints){
				return currentLevelPoints + amountToIncrease;
			}, function(error){
				if(error){
					console.log(error)
				}
			});
			userCurrentPointsRef.transaction(function(currentGamePoints){
				return currentGamePoints + amountToIncrease;
			}, function(error){
				if(error){
					console.log(error)
				}
			})
		})
	})
}

function givePoints(difference, typeOfPoints, playerName){
	db.ref('pointRules').once('value', function(snapshot){
		var pointRules = snapshot.val();
		amountToIncrease = pointRules[typeOfPoints] * difference;
		givePointsToUsers(playerName, amountToIncrease);
	})
}

function compareStats(ourPlayer, wnbaPlayer){
	var oldAssists = ourPlayer.assists
	oldRebs = ourPlayer.goodPlays
	oldPts = ourPlayer.goals
	correctAsts = wnbaPlayer.assists
	correctRebs = wnbaPlayer.goodPlays
	correctPts = wnbaPlayer.goals
	playerName = ourPlayer.name
	
	if(oldAssists < correctAsts){
		var difference = correctAsts - oldAssists
		givePoints(difference, 'perAssist', playerName)
	}
	if(oldRebs < correctRebs){
		var difference = correctRebs - oldRebs
		givePoints(difference, 'perGoodPlay', playerName)
	}
	if(oldPts < correctPts){
		var difference = correctPts - oldPts
		givePoints(difference, 'perGoal', playerName)
	}
	ourPlayer.assists = correctAsts
	ourPlayer.goals = correctPts
	ourPlayer.goodPlays = correctRebs
	
	currentSelectedPlayersRef.child(playerName).set(ourPlayer)
	currentSelectedPlayersRef1.child(playerName).set(ourPlayer)
	playerRef.child(ourPlayer.id).set(ourPlayer);
}

function updateOurPlayerStats(playerToChange){
	var number = parseInt(playerToChange.number)
	playerRef.once("value", function(snapshot){
		snapshot.forEach(function(data){
			var player = data.val()
			//Find Player
			
			if(number === parseInt(player.number)){
				compareStats(player, playerToChange)
			}
		})
	});
}

statsRef.on("child_changed", function(snapshot){
	//On Data Change Update Stats
	var changedPost = snapshot.val();
	todayScore.once("value", function(snapshot){
		var todayScore = snapshot.val();
		if(todayScore['home']===1){
			updateOurPlayerStats(changedPost)
		} else {
			//wait for away games
			setTimeout(function(){updateOurPlayerStats(changedPost);}, tvDelay);
		}
	});
})

app.get('/', function(req,res){
	res.send("HURRAY");
});

app.listen(3000, function(){
	console.log('Example app listening on port 3000')
})