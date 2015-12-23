'use strict';

var qM = require('../utils/queue-manager');
var PerfectChallengeScraper = require('../scrapers/perfect-challenge.server.js');
var GoogleSpreadsheet = require('google-spreadsheet');
var l = require('../utils/logging');
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
				division : row.division,
				owner : row.owner,
				customDivision : row.customdivision
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
				division : row.division,
				owner : row.owner,
				customDivision : row.customdivision
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
		playerOverall.owner = playerBonus.owner;
		playerOverall.customDivision = playerBonus.customDivision;
		if (playerBonus.gender) {
			playerOverall.gender = playerBonus.gender;
		}
	});
	var players = sortAndRank(playerPageOverall.players);
	var playerPage = {
		players : players,
		stat : stat,
		bonus: bonus
	};
	if (playerPageOverall.week) {
		playerPage.week = playerPageOverall.week;
	}
	return playerPage;
}

function addPeonMaster(playersPage) {
	if (playersPage.bonus) {
		_.each(playersPage.players, function(player) {
			if (player.unverifiedRank <= 5) {
				player.master = true;
			} else if (player.unverifiedRank >= 16) {
				player.peon = true;
			}
		});
	}
}

function weeklyWithDivisions(stat, bonus, week) {
	return PerfectChallengeScraper.fetchPlayerPage(week).then(function(playerPageWeek) {
		return scarBonusWeekly(playerPageWeek.week).then(function(playerPageBonus) {
			return applyDivisions(playerPageWeek, playerPageBonus, stat, bonus);
		});
	});
}

function overallWithDivisionsWeekEnding(stat, bonus, week, weekEnding, playersPageOverall) {
	l('weeks', week, ' ', weekEnding);
	return weeklyWithDivisions(stat, bonus, week).then(function (weekPlayerPage) {
		if (week===1) {
			playersPageOverall = {
				players : weekPlayerPage.players,
				stat : stat,
				week: weekEnding,
				bonus: bonus
			};
		} else {
			_.each(weekPlayerPage.players, function(player) {
				var playerOverall = _.find(playersPageOverall.players, function(player2) {
					return player.name === player2.name;
				});
				playerOverall.unverifiedPoints += player.unverifiedPoints;
			});
		}
		if (week === weekEnding) {
			playersPageOverall.players = sortAndRank(playersPageOverall.players);
			addPeonMaster(playersPageOverall);
			return playersPageOverall;
		} else {
			return overallWithDivisionsWeekEnding(stat, bonus, week+1, weekEnding, playersPageOverall);
		}
	});
}

function overallWithDivisions(stat, bonus) {
	return PerfectChallengeScraper.fetchPlayerPageOverall().then(function(playerPageOverall) {
		return scarBonusOverall().then(function(playerPageBonus) {
			var playerPage = applyDivisions(playerPageOverall, playerPageBonus, stat, bonus);
			addPeonMaster(playerPage);
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
		var playerPageDivisions = {
			players: divisions,
			stat : stat,
			bonus : playerPage.bonus || false
		};
		if (playerPage.week) {
			playerPageDivisions.week = playerPage.week;
		}
		return playerPageDivisions;
	});
}

function bestFromTwoSpots(best, roster1, roster2, index) {
	var fbPlayers = [roster1[index], roster1[index+1], roster2[index], roster2[index+1]];
	fbPlayers = _.uniq(fbPlayers, function(fbPlayer) {
		return fbPlayer.firstName+' '+fbPlayer.lastName;
	});
	fbPlayers = _.sortBy(fbPlayers, function(fbPlayer) {
		return -1 * fbPlayer.pts;
	});
	best[index] = fbPlayers[0];
	if (fbPlayers.length>1) {
		best[index+1] = fbPlayers[1];
	} else {
		best[index+1] = {
			known: false,
			position : fbPlayers[0].position
		};
	}
}

function bestCombinedRoster(roster1, roster2) {
	var best = _.map(roster1, function(fbPlayer1, index) {
		var fbPlayer2 = roster2[index];
		if (!fbPlayer2.known || (fbPlayer1.known && fbPlayer1.pts >= fbPlayer2.pts)) {
			return fbPlayer1;
		} else {
			return fbPlayer2;
		}
	});
	bestFromTwoSpots(best, roster1, roster2, 1);
	bestFromTwoSpots(best, roster1, roster2, 3);
	return best;
}

function divisionsBestLineup(promise, stat, custom) {
	return promise.then(function(playerPage) {
		var players = playerPage.players;
		var divisions = [];
		_.each(players, function(player) {
			var divisionName = (custom?player.customDivision:player.division);
			var division = _.find(divisions, function(division) {
				return division.name === divisionName;
			});
			if (!division && divisionName) {
				division = {
					name :  divisionName,
					unverifiedPoints : player.unverifiedPoints,
					roster : player.roster
				};
				divisions.push(division);
			} else if (divisionName) {
				division.roster = bestCombinedRoster(player.roster, division.roster);
				var unknowns = _.filter(division.roster, {known:false});
				division.unknownCount = unknowns.length;
				division.unknownPositions = _.map(unknowns, 'position');
				division.unverifiedPoints = _.sum(division.roster, 'pts');
			}
		});
		divisions = sortAndRank(divisions);
		var playerPageDivisions = {
			players: divisions,
			stat : stat,
			bonus : false
		};
		if (playerPage.week) {
			playerPageDivisions.week = playerPage.week;
		}
		return playerPageDivisions;
	});
}

// stat - overall, weekly, division, division by week, bonus, bonus by week
// checkbox (include bonus)

var genderData = {
	'http://perfectchallenge.fantasy.nfl.com/entry?entryId=2220785':'f',
	'http://perfectchallenge.fantasy.nfl.com/entry?entryId=2238240':'f',
	'http://perfectchallenge.fantasy.nfl.com/entry?entryId=2267549':'f',
	'http://perfectchallenge.fantasy.nfl.com/entry?entryId=2212251':'f',
	'http://perfectchallenge.fantasy.nfl.com/entry?entryId=2235690':'f'
};

function genderMap(promise, stat) {
	return promise.then(function(playerPage) {
		var players = playerPage.players;
		var genders = [];
		var male = {
			unverifiedPoints: 0,
			name: 'Dudes',
			count: 0,
			url : 'http://mentalfloss.com/sites/default/legacy/blogs/wp-content/uploads/2012/01/the-dude.jpg'
		};
		var female = {
			unverifiedPoints: 0,
			name: 'Chicks',
			count: 0,
			url : 'http://www.digitalclaritygroup.com/wordpress/wp-content/uploads/2013/04/chicks.jpg'
		};
		genders.push(male);
		genders.push(female);
		_.each(players, function(player) {
			var g = male;
			console.log(player.url);
			if (genderData[player.url]) {
				g = female;
			}
			g.unverifiedPoints = (g.unverifiedPoints*g.count+player.unverifiedPoints)/(g.count+1);
			g.count++;
		});
		genders = sortAndRank(genders);
		var gendersPage = {
			players: genders,
			stat : stat,
			bonus: playerPage.bonus
		};
		if (playerPage.week) {
			gendersPage.week = playerPage.week;
		}
		return gendersPage;
	});
}

exports.perfectchallenge = function(req) {
	var stat = req.param('stat') || 'weekly';
	var bonus = req.param('bonus') === 'true';
	var week = req.param('week');
	if (stat === 'overall') {
		return overallWithDivisions(stat, bonus);
	} else if (stat === 'overallWeekEnding') {
		week = week || calcDefaultWeek();
		return overallWithDivisionsWeekEnding(stat, bonus, 1, parseInt(week));
	} else if (stat === 'gender') {
		return genderMap(overallWithDivisions(stat, bonus), stat);
	} else if (stat === 'genderByWeek') {
		return genderMap(weeklyWithDivisions(stat, bonus, week), stat);
	} else if (stat === 'divisions') {
		return divisions(overallWithDivisions(stat, bonus), stat);
	} else if (stat === 'divisionsBestLineupByWeek') {
		return divisionsBestLineup(weeklyWithDivisions(stat, bonus, week), stat, false);
	} else if (stat === 'customBestLineupByWeek') {
		return divisionsBestLineup(weeklyWithDivisions(stat, bonus, week), stat, true);
	} else if (stat === 'divisionsByWeek') {
		return divisions(weeklyWithDivisions(stat, bonus, week), stat);
	} else if (stat === 'bonus') {
		return scarBonusOverall();
	} else if (stat === 'bonusByWeek') {
		return scarBonusWeekly(week);
	} else if (stat === 'weekly') {
		return weeklyWithDivisions(stat, bonus, week);
	}
};

exports.perfectchallengeQueue = function(req) {
	var statWeek = parseInt(req.param('statWeek'));
	qM.add(qM.PLAYER_LIST_QUEUE, {
		week: statWeek
	});
	return {success:true};
};
