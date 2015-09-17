'use strict';

var pH = require('../utils/promiseHandler');
var scrape = require('../../app/controllers/scrape');
var qM = require('../utils/queue-manager');


module.exports = function (app) {

	app.route('/scrape/perfectchallenge')
		.get(pH.jsonp(scrape.perfectchallenge));

	app.route('/scrape/perfectchallengeQueue')
		.get(pH.jsonp(scrape.perfectchallengeQueue));

	app.route('/test/calcDiff')
		.get(pH.jsonp(function() {
			qM.add(qM.CALC_DIFFERENCE_QUEUE, {week:1});
			return {success:true};
		}));

};
