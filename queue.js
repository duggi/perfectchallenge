'use strict';
/**
 * Module dependencies.
 */
var init = require('./config/init')('Periodic');
var	config = require('./config/config');
var	connections = require('./config/connections');
var	qM = require('./app/utils/queue-manager');

//mongoose.set('debug', true);

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */
if (process.argv.length < 3) {
	console.error('missing name of queue. Exiting.');
	process.exit(-1);
}

var queueName = process.argv[2];

connections.connect(config.db, config.rabbit).then(function() {
	try {
		qM.add(queueName, {});
		qM.exchange.on('drain', process.exit);
	} catch (err) {
		console.error('Error starting: '+err);
		console.error(err.stack);
		process.exit(-1);
	}
}, function() {
	console.error('Exiting');
	process.exit(-1);
});
