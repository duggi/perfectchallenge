'use strict';

var pH = require('../utils/promiseHandler');
var scrape = require('../../app/controllers/scrape');


module.exports = function (app) {

	app.route('/scrape/perfectchallenge')
		.get(pH.jsonp(scrape.perfectchallenge));

};
