'use strict';

var qM = require('../utils/queue-manager');
var PerfectChallengeScraper = require('../scrapers/perfect-challenge.server.js');
var GoogleSpreadsheet = require('google-spreadsheet');
var q = require('q');

exports.perfectchallenge = function(req) {
	var week = req.param('week');
	if (week === 'overall') {
		return PerfectChallengeScraper.fetchPlayerPageOverall();
	} else {
		return PerfectChallengeScraper.fetchPlayerPage(req.param('week'));
	}
};

exports.scarsBonus = function(req) {
	// spreadsheet key is the long id in the sheets URL
	var scarSheet = new GoogleSpreadsheet('1mRT_lp_igtjXHscx_1tbAwdliQyHeSX7YJpUJcHmXuU');
	var getRows = q.nbind(scarSheet.getRows, scarSheet);
	return getRows( 1 );
};


exports.perfectchallengeQueue = function(req) {
	var statWeek = parseInt(req.param('statWeek'));
	qM.add(qM.PLAYER_LIST_QUEUE, {
		week: statWeek
	});
	return {success:true};
};
