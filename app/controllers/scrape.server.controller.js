'use strict';

var mongoose = require('mongoose');
var request = require('request-promise');
var q = require('q');
var l = require('../utils/logging');
var _ = require('lodash');
var cheerio = require('cheerio');

function getPlayers(path, players) {
	players = players || [];
	var url = 'http://perfectchallenge.fantasy.nfl.com'+path;
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

exports.perfectchallenge = function(req) {
	var diff = (new Date().getTime() - new Date(2015, 8, 10).getTime())/(7*24*60*60*1000);
	var defaultWeek = Math.min(17, Math.max(1, Math.floor(diff)+1));
	var statWeek = req.param('statWeek') || defaultWeek;
	return getPlayers('/group/41592?statType=week&statWeek='+statWeek).then(function(playersPage) {
		var players = playersPage.players;
		var promises = _.map(players, function(player) {
			return getRoster(player.url+'&week='+statWeek);
		});
		return q.all(promises).then(function(rosters) {
			_.each(rosters, function(roster, i) {
				players[i].roster = roster;
				var unknowns = _.filter(roster, {known:false});
				players[i].unknownCount = unknowns.length;
				players[i].unknownPositions = _.map(unknowns, 'position');
				players[i].unverifiedPoints = _.sum(roster, 'pts');
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
