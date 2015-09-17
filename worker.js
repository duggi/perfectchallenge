'use strict';
/**
 * Module dependencies.
 */
var init = require('./config/init')('Worker');
var	config = require('./config/config');
var	connections = require('./config/connections');
var	path = require('path');
var Nexmo = require('easynexmo');
var _ = require('lodash');

require('./config/mongoose-patch');

var QUEUE_HANDLERS = [
	'./app/scrapers/perfect-challenge',
	'./app/utils/sms'
];

function start() {
	connections.connect(config.db, config.rabbit).then(function() {
		try {
			config.getGlobbedFiles('./app/models/**/*.js').forEach(function(modelPath) {
				require(path.resolve(modelPath));
			});
			Nexmo.initialize(config.nexmo.apiKey, config.nexmo.secret, 'https', true);
			_.each(QUEUE_HANDLERS, function(handler) {
				require(handler).registerHandlers();
			});
			console.log('WORKER STARTED');
		} catch (err) {
			console.error('Error starting: '+err);
			console.error(err.stack);
		}
	}, function() {
		console.error('Exiting');
		process.exit();
	});
}

start();
