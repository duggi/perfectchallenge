'use strict';

var qM = require('../utils/queue-manager');
var PerfectChallengeScraper = require('../scrapers/perfect-challenge.server.js');

exports.perfectchallenge = function(req) {
	var diff = (new Date().getTime() - new Date(2015, 8, 10).getTime())/(7*24*60*60*1000);
	var defaultWeek = Math.min(17, Math.max(1, Math.floor(diff)+1));
	var statWeek = parseInt(req.param('statWeek')) || defaultWeek;
	return PerfectChallengeScraper.fetchPlayerPage(statWeek);
};

exports.perfectchallengeQueue = function(req) {
	qM.add(qM.PLAYER_LIST_QUEUE, {
		week: parseInt(req.param('statWeek'))
	});
	return {success:true};
};
