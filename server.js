'use strict';
/**
 * Module dependencies.
 */
var init = require('./config/init')('Web');
var	config = require('./config/config');
var	connections = require('./config/connections');

//mongoose.set('debug', true);

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

connections.connect(config.db, config.rabbit).then(function() {
	// Init the express application
	var app = require('./config/express')(connections.db);

	// Bootstrap passport config
	require('./config/passport')();

	// Start the app by listening on <port>
	app.listen(config.port);

	// Expose app
	exports = module.exports = app;

	// Logging initialization
	console.log('MEAN.JS application started on port ' + config.port);
}, function() {
	console.error('Exiting');
	process.exit();
});

