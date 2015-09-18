'use strict';

var mongoose = require('mongoose');
var request = require('request-promise');
var q = require('q');
var l = require('../utils/logging');
var _ = require('lodash');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var PlayerPage = mongoose.model('PlayerPage');
var qM = require('../utils/queue-manager');
var random = require('../utils/random');
var sms = require('../utils/sms');


function calcDefaultWeek() {
	var diff = (new Date().getTime() - new Date(2015, 8, 10).getTime())/(7*24*60*60*1000);
	return Math.min(17, Math.max(1, Math.floor(diff)+1));
}

function getPlayers(path, players) {
	players = players || [];
	var url = 'http://perfectchallenge.fantasy.nfl.com'+path;
	l('fetching '+url);
	return q(request(url)).then(function(data) {
		var $ = cheerio.load(data);
		var tableWrap = $('.table-wrap');
		var trs = $('tbody tr', tableWrap);
		trs.each(function(i, tr) {
			var player = {
				rank : $('.groupEntryRank', tr).text(),
				name : $('a', tr).text(),
				url : $('a', tr).attr('href'),
				verifiedPoints : $('.groupEntryPts', tr).text()
			};
			if (!_.find(players, {name:player.name})) {
				players.push(player);
			}
		});
		var nextUrl = $('.next a').attr('href');
		if (nextUrl) {
			return getPlayers(nextUrl, players);
		} else {
			var week = parseInt($('.week-selector .label').text().split(' ')[1]);
			return {
				players : players,
				week : week
			};
		}
	});
}

function getRoster(path) {
	var url = 'http://perfectchallenge.fantasy.nfl.com'+path;
	l('fetching '+url);
	return q(request(url)).then(function(data) {
		var $ = cheerio.load(data);
		var slots = $('.roster-slot .player');
		var fbPlayers = [];
		slots.each(function(i, slot) {
			var fbPlayer = {
				position : $('.position', slot).text(),
			};
			if ($('.first-name', slot).text() || $('.last-name', slot).text()) {
				fbPlayer.firstName = $('.first-name', slot).text();
				fbPlayer.lastName = $('.last-name', slot).text();
				fbPlayer.pct = parseFloat($('.pct em', slot).text());
				fbPlayer.pts = parseFloat($('.pts em', slot).text());
				fbPlayer.known = true;
			} else {
				fbPlayer.known = false;
			}
			fbPlayers.push(fbPlayer);
		});
		return fbPlayers;
	});
}

exports.fetchPlayerPage = function(week) {
	week = week || calcDefaultWeek();
	return getPlayers('/group/41592?statType=week&statWeek='+week).then(function(playersPage) {
		var players = playersPage.players;
		var promises = _.map(players, function(player) {
			return getRoster(player.url+'&week='+week);
		});
		return q.all(promises).then(function(rosters) {
			_.each(rosters, function(roster, i) {
				players[i].roster = roster;
				var unknowns = _.filter(roster, {known:false});
				players[i].unknownCount = unknowns.length;
				players[i].unknownPositions = _.map(unknowns, 'position');
				players[i].unverifiedPoints = _.sum(roster, 'pts'); // + random.int(0,30);
			});
			players = _.sortBy(players, function(player) {
				return -1 * player.unverifiedPoints;
			});
			_.each(players, function(player, i) {
				player.unverifiedRank = (i+1);
			});
			playersPage.players = players;
			return playersPage;
		});
	});
};

function fetchAndSavePlayerPage(job) {
	var week = job.week;
	week = week || calcDefaultWeek();
	return exports.fetchPlayerPage(week).then(function(playerPage) {
		return PlayerPage.findOne({week:week}).sort({createdAt:-1}).exec().then(function(playerPageDb) {
			if (!playerPageDb) {
				return PlayerPage.create(playerPage);
			} else {
				var difference = false;
				if (playerPageDb.players.length !== playerPage.players.length) {
					difference = true;
				} else {
					_.each(playerPage.players, function(player1, i) {
						var player2 = playerPageDb.players[i];
						if (player1.name !== player2.name || player1.unverifiedPoints !== player2.unverifiedPoints) {
							difference = true;
						}
					});
				}
				if (difference) {
					return PlayerPage.create(playerPage).then(function(playerPageDb2) {
						qM.add(qM.CALC_DIFFERENCE_QUEUE, {week:week});
						return playerPageDb2;
					});
				} else {
					return playerPageDb;
				}
			}
		});
	});
}

function removeFrom(playerArr1, playerArr2) {
	_.each(playerArr2, function(player) {
		_.remove(playerArr1, {name:player.name});
	});
	return playerArr1;
}

function names(playerArr) {
	var s = '';
	for(var i = 0; i < playerArr.length; i++) {
		s += playerArr[i].name;
		if (i === playerArr.length-2) {
			s+= ' and ';
		} else if (i < playerArr.length-2) {
			s += ', ';
		}
	}
	return s;
}

function calcPlayerDifference(playerNew, playerPageNew, playerPageOld) {
	var playersAheadNew = playerPageNew.players.slice(0, playerNew.unverifiedRank-1);
	var playersBehindNew = playerPageNew.players.slice(playerNew.unverifiedRank);
	var playerOld = _.find(playerPageOld.players, {name:playerNew.name});
	var playersAheadOld = playerPageOld.players.slice(0, playerOld.unverifiedRank-1);
	var playersBehindOld = playerPageOld.players.slice(playerOld.unverifiedRank);
	var playersPassed = removeFrom(playersAheadOld, playersAheadNew);
	var playersPassedMe = removeFrom(playersBehindOld, playersBehindNew);
	if (playerNew.unverifiedRank !== playerOld.unverifiedRank || playersPassed.length || playersPassedMe.length) {
		var text = 'You ('+playerNew.name+') are currently ranked #'+playerNew.unverifiedRank+' this week.';
		if (playersPassed.length) {
			text += ' You just passed '+names(playersPassed) + '.';
		}
		if (playersPassedMe.length) {
			text += ' You were just passed by '+names(playersPassedMe) + '.';
		}
		return text;
	} else {
		return null;
	}
}

var PLAYER_PHONES = {
	'80\'s Spaceman' : '+15109674275',
	'Cleveland Steamers' : '+14156139817',
	'Deez Nuts for Prez' : '+16505761388',
	'Terrible Towelies' : '+14157229175'
};
/*
var PLAYER_PHONES = {
	'80\'s Spaceman' : '+15109674275',
	'Cleveland Steamers' : '+15109674275',
	'Deez Nuts for Prez' : '+15109674275',
	'Terrible Towelies' : '+15109674275'
};
*/
function calculateDifference(job) {
	var week = job.week;
	return PlayerPage.find({week:week}).sort({createdAt:-1}).limit(2).exec().then(function(playerPages) {
		if (playerPages.length !== 2) {
			console.err('can not calculate difference didnt get to items');
			return;
		}
		var playerPageNew = playerPages[0];
		var playerPageOld = playerPages[1];
		var sentCount = 0;
		_.each(playerPageNew.players, function(playerNew) {
			var text = calcPlayerDifference(playerNew, playerPageNew, playerPageOld);
			if (text && PLAYER_PHONES[playerNew.name]) {
				// need to throttle sending. This is a bit hacky
				setTimeout(function() {
					sms.sendQueued(PLAYER_PHONES[playerNew.name], text);
				}, sentCount*2000);
				sentCount++;
			}
		});
		return true;
	});
}

exports.registerHandlers = function() {
	qM.registerHandler(qM.PLAYER_LIST_QUEUE, fetchAndSavePlayerPage);
	qM.registerHandler(qM.CALC_DIFFERENCE_QUEUE, calculateDifference);
};
