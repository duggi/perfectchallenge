'use strict';

var qM = require('../utils/queue-manager');
var PerfectChallengeScraper = require('../scrapers/perfect-challenge.server.js');
var GoogleSpreadsheet = require('google-spreadsheet');
var q = require('q');
var _ = require('lodash');

function sortAndRank(players) {
	players = _.sortBy(players, function(player) {
		return -1 * player.unverifiedPoints;
	});
	_.each(players, function(player, i) {
		player.unverifiedRank = (i+1);
	});
	return players;
}

function scarBonus() {
	var scarSheet = new GoogleSpreadsheet('1mRT_lp_igtjXHscx_1tbAwdliQyHeSX7YJpUJcHmXuU');
	var getRows = q.nbind(scarSheet.getRows, scarSheet);
	return getRows( 1).then(function(rows) {
		var playerBonuses = _.map(rows, function(row)  {
			var bonus = 0;
			for(var i = 1; i <= 17; i++) {
				var weekBonus = parseInt(row['week'+i+'bonus']);
				if (weekBonus) {
					bonus += weekBonus;
				}
			}
			return {
				unverifiedPoints : bonus,
				url : row['nfl.comlink'],
				name : row.team,
				division : row.division
			};
		});
		var players = sortAndRank(playerBonuses);
		return {
			players : players,
			stat : 'bonus'
		};
	});
}

function overallWithBonus() {
	return PerfectChallengeScraper.fetchPlayerPageOverall().then(function(playerPageOverall) {
		return scarBonus().then(function(playerPageBonus) {
			_.each(playerPageOverall.players, function(playerOverall) {
				var playerBonus = _.find(playerPageBonus.players, function(playerBonus) {
					return playerOverall.url === playerBonus.url;
				});
				playerOverall.unverifiedPoints += playerBonus.unverifiedPoints;
				playerOverall.division = playerBonus.division;
			});
			var players = sortAndRank(playerPageOverall.players);
			return {
				players : players,
				stat : 'overallWithBonus'
			};
		});
	});
}

function divisions() {
	return overallWithBonus().then(function(playerPageOverall) {
		var players = playerPageOverall.players;
		var divisions = [];
		_.each(players, function(player) {
			var division = _.find(divisions, function(division) {
				return division.name === player.division;
			});
			if (!division) {
				division = {
					name : player.division,
					unverifiedPoints : player.unverifiedPoints
				};
				divisions.push(division);
			} else {
				division.unverifiedPoints += player.unverifiedPoints;
			}
		});
		divisions = sortAndRank(divisions);
		return {
			players: divisions,
			stat : 'divisions'
		};
	});
}

exports.perfectchallenge = function(req) {
	var stat = req.param('stat');
	if (stat === 'overall') {
		return PerfectChallengeScraper.fetchPlayerPageOverall();
	} else if (stat === 'overallWithBonus') {
		return overallWithBonus();
	} else if (stat === 'divisions') {
		return divisions();
	} else if (stat === 'bonus') {
		return scarBonus();
	} else {
		return PerfectChallengeScraper.fetchPlayerPage(stat);
	}
};

exports.perfectchallengeQueue = function(req) {
	var statWeek = parseInt(req.param('statWeek'));
	qM.add(qM.PLAYER_LIST_QUEUE, {
		week: statWeek
	});
	return {success:true};
};
