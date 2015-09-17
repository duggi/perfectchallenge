'use strict';

var connections = require('../../config/connections');

exports.PLAYER_LIST_QUEUE = 'PLAYER_LIST_QUEUE';
exports.CALC_DIFFERENCE_QUEUE = 'CALC_DIFFERENCE_QUEUE';

var exchange = null;

exports.add = function(name, job) {
	if (!exchange) {
		exchange = connections.queue.default();
	}
	exchange.publish(job, { key: name });
};

exports.registerHandler = function(name, handler) {
	if (!exchange) {
		exchange = connections.queue.default();
	}
	exchange.queue({name: name}).consume(function(job, ack) {
		handler(job).then(function() {
			ack();
		}, function(err) {
			console.error('failed for job '+JSON.stringify(job)+' '+err);
			console.error(err.stack);
			ack();
		});
	});
};

