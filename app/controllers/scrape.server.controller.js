'use strict';

var qM = require('../utils/queue-manager');
var PerfectChallengeScraper = require('../scrapers/perfect-challenge.server.js');

exports.perfectchallenge = function(req) {
	return PerfectChallengeScraper.fetchPlayerPage(req.param('statWeek'));
};

exports.perfectchallengeQueue = function(req) {
	var statWeek = parseInt(req.param('statWeek'));
	qM.add(qM.PLAYER_LIST_QUEUE, {
		week: statWeek
	});
	return {success:true};
};
