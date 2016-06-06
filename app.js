var express = require('express');
fs = require('fs');
request = require('request');
app = express();
firebase = require("firebase");

firebase.initializeApp({
	serviceAccount: {
		projectId: "testnewfirebase-50f80",
		clientEmail: "realtestaccount@testnewfirebase-50f80.iam.gserviceaccount.com",
		privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCN9nQwMZQKry3i\n4g6dH2pKPUWsenhPOPZ74JqT+KQB7bQg0rLKwq7Rpyj1vXORgXwdGongKA0JHYvD\ncnhpAEvr8DaNZiv4TnR2IR6210JOILE4ZND+Wr0kWpjmD7rJtTkIRYwDrvBxkK5S\nriSgGXHKpfLV4yowDIHEvovD6cVHXLE3szg+am3HukuzQd4zWXxgY2E0uxAORlCS\nErJkGXKXcCJdOHYErApzp60m2eKOEkjkDO1u2teEe4g3rtxaYCoE8ZwjhvDWfEb5\ngB91uo4cTttltjkmzg6N2XfFuDJJOUJsP5jfrQS7ctU6TRRydUHz6U5JujHL+ElR\n+JzErinbAgMBAAECggEAKFVpVXgAk7iJ1PhdJo8SZ91YulRhckDA5xk9UeVG07Vx\nhBHY8nq1qKNRo+Abwa+ET9CGc8VtTrWyS+luBIctCu/I0AvDWl0QAbAPReuKzx/C\nuj8Kkfm922JSJqs5aq2ucocv7Kv7bIiqvprzlPklt2nGwLY1+kjTZc6tbxAwGMHz\nbXl6UoLpfCYGYlriB/WlaO6ZYT4pCB5AGBDsTrj4jo3XHSHwgHZmaOHKqiHn+uCm\nEHqYEtKvfnB399tFfcuAiBd4TsdzTl5o2D5//+osSsNjcIqeMSLZ0afeIjcPzjA3\nNYWrh871QUonAkTjBthAxzCqbcNYCp5JQmpX8AfJAQKBgQDf3KHngqeJPZpoOTLy\nlpDGEpgdPJ9aHQXncoJ5p+Qxx9A+dQthLqDCfd/NIEeYiKZYTOn6+4gnDRFBPUEV\nvLYeKGWMaD64BbHym32LrGjuf6+3o6fgY5PvX45pnp/YZtToV1etsecTK12Zde9A\nTtVC8cCujM2x/J/1sEoi1C7xuwKBgQCiV92RdldSwv7pd0qHe66EDu9dfSWGAr/w\ntUy88nhbRR15nc8StposMpogNJgW657aFQKaRkypvd0gwKPRKQHJKJrLZba7g0eC\nFhYKwvbvOyzwx2rPY6/hMeZO2k5iD7UQlb8LDiwN05/e7inzb064IMVWHyzDXxGp\nB1EsTzOWYQKBgCJ9SpBxh8BUNmLSVTAc1Gc/3CG9AkwO5qb29HUr0bN9tm6496zc\nUzZD0GQ5Ee7FNuOpze62LA7gK4Vim5Fuxpw02xhbwzX04qqfHCOVx4DfOUJQu3+N\nt/AMR9Or9bKQfULimgaPvysr5jrLebXtr1umBWqfFN3ULwzaQUHGcQkbAoGBAIey\nYiXAgWVQULrdV5K/szP3N+UxQjgt/Do7kRUup6PCtcx+OCQwNdZTxbi9vZMLCBDK\nFw7VTCdl6HwECeo/GJsIMbtqHb/HD/KQe4QrSzTUhdANIB6R+OWHTDcFCxe0gWiH\ngtS+19wG1E8HTFGK7IXD/q7qCASWZrCeyR78ZOaBAoGANqKHFpwOM37zuHmJqlUH\np1WuMeuRp5UiRg1hYOkWhP2OLUYqnkDcfBq3i6UFdjvXOJplzVt8W5YCbS2HtkKx\nzZp+oxHo8Qy6LPshpd90G5jBPEckHRCFBWQfPQ6q78y9kqADRraVstIQ3+KYK4g7\nvnnjOFOsJSk07CoqU1k1LxM=\n-----END PRIVATE KEY-----\n"
	},
	databaseURL: "https://testnewfirebase-50f80.firebaseio.com/"
})

var db = firebase.database();
gameDayDetail = "http://data.wnba.com/data/1m/v2015/json/mobile_teams/wnba/2016/scores/gamedetail/1011600003_gamedetail.json"
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