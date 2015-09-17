'use strict';
/**
 * Module dependencies.
 */
var init = require('./config/init')('Worker');
var	config = require('./config/config');
var	connections = require('./config/connections');
var	path = require('path');
var throng = require('throng');

require('./config/mongoose-patch');

function start() {
	connections.connect(config.db, config.rabbit).then(function() {
		config.getGlobbedFiles('./app/models/**/*.js').forEach(function(modelPath) {
			require(path.resolve(modelPath));
		});
		var scraper = require('./app/scrapers/perfect-challenge');
		scraper.registerScrapers();
		console.log('WORKER STARTED');
	}, function() {
		console.error('Exiting');
		process.exit();
	});
}

start();
