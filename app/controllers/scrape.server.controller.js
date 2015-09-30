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

function calcDefaultWeek() {
	var diff = (new Date().getTime() - new Date(2015, 8, 10).getTime())/(7*24*60*60*1000);
	return Math.min(17, Math.max(1, Math.floor(diff)+1));
}


function scarBonusOverall() {
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

function scarBonusWeekly(week) {
	week = parseInt(week) || calcDefaultWeek();
	var scarSheet = new GoogleSpreadsheet('1mRT_lp_igtjXHscx_1tbAwdliQyHeSX7YJpUJcHmXuU');
	var getRows = q.nbind(scarSheet.getRows, scarSheet);
	return getRows( 1).then(function(rows) {
		var playerBonuses = _.map(rows, function(row)  {
			var bonus = 0;
			var weekBonus = parseInt(row['week'+week+'bonus']);
			if (weekBonus) {
				bonus += weekBonus;
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
			stat : 'bonusByWeek',
			week : week
		};
	});
}

function applyDivisions(playerPageOverall, playerPageBonus, stat, bonus) {
	_.each(playerPageOverall.players, function(playerOverall) {
		var playerBonus = _.find(playerPageBonus.players, function(playerBonus) {
			return playerOverall.url === playerBonus.url;
		});
		if (bonus) {
			playerOverall.unverifiedPoints += playerBonus.unverifiedPoints;
		}
		playerOverall.division = playerBonus.division;
	});
	var players = sortAndRank(playerPageOverall.players);
	return {
		players : players,
		stat : stat,
		bonus: bonus
	};
}

function overallWithDivisions(stat, bonus) {
	return PerfectChallengeScraper.fetchPlayerPageOverall().then(function(playerPageOverall) {
		return scarBonusOverall().then(function(playerPageBonus) {
			return applyDivisions(playerPageOverall, playerPageBonus, stat, bonus);
		});
	});
}

function weeklyWithDivisions(stat, bonus, week) {
	return PerfectChallengeScraper.fetchPlayerPage(week).then(function(playerPageWeek) {
		return scarBonusWeekly(playerPageWeek.week).then(function(playerPageBonus) {
			var playerPage = applyDivisions(playerPageWeek, playerPageBonus, stat, bonus);
			playerPage.week = playerPageWeek.week;
			return playerPage;
		});
	});
}

function divisions(promise, stat) {
	return promise.then(function(playerPage) {
		var players = playerPage.players;
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
			stat : stat,
			bonus : playerPage.bonus || false
		};
	});
}
// stat - overall, weekly, division, division by week, bonus, bonus by week
// checkbox (include bonus)

exports.perfectchallenge = function(req) {
	var stat = req.param('stat') || 'weekly';
	var bonus = req.param('bonus') === 'true';
	var week = req.param('week');
	if (stat === 'overall') {
		if (bonus) {
			return overallWithDivisions(stat, bonus);
		} else {
			return PerfectChallengeScraper.fetchPlayerPageOverall();
		}
	} else if (stat === 'divisions') {
		return divisions(overallWithDivisions(stat, bonus), stat);
	} else if (stat === 'divisionsByWeek') {
		return divisions(weeklyWithDivisions(stat, bonus, week), stat);
	} else if (stat === 'bonus') {
		return scarBonusOverall();
	} else if (stat === 'bonusByWeek') {
		return scarBonusWeekly(week);
	} else if (stat === 'weekly') {
		if (bonus) {
			return weeklyWithDivisions(stat, bonus, week);
		} else {
			return PerfectChallengeScraper.fetchPlayerPage(week);
		}
	}
};

exports.perfectchallengeQueue = function(req) {
	var statWeek = parseInt(req.param('statWeek'));
	qM.add(qM.PLAYER_LIST_QUEUE, {
		week: statWeek
	});
	return {success:true};
};
