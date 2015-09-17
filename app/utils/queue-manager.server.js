'use strict';

var connections = require('../../config/connections');

exports.PLAYER_LIST_QUEUE = 'PLAYER_LIST_QUEUE';
exports.CALC_DIFFERENCE_QUEUE = 'CALC_DIFFERENCE_QUEUE';
exports.SMS_QUEUE = 'SMS_QUEUE';

exports.exchange = null;

exports.add = function(name, job) {
	if (!exports.exchange) {
		exports.exchange = connections.queue.default();
	}
	exports.exchange.publish(job, { key: name });
};

exports.registerHandler = function(name, handler) {
	if (!exports.exchange) {
		exports.exchange = connections.queue.default();
	}
	exports.exchange.queue({name: name}).consume(function(job, ack) {
		handler(job).then(function() {
			ack();
		}, function(err) {
			console.error('failed for job '+JSON.stringify(job)+' '+err);
			console.error(err.stack);
			ack();
		});
	});
};
