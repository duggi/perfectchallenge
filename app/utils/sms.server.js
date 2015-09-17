'use strict';

var q = require('q');
var _ = require('lodash');
var Nexmo = require('easynexmo');
var qM = require('./queue-manager');

var testNumbers = ['1111111111','2222222222','3333333333','4444444444','5555555555',
	'6666666666','7777777777','8888888888','9999999999', '+14155553333', '+639185553333'];

/*
 Puts a standard promise wrapper around Nexmo and does a little error parsing.
 */
exports.send = function(phoneNumber, message) {
	if (_.contains(testNumbers, phoneNumber)) {
		// if a test number just skip
		return;
	}
	var defer = q.defer();
	Nexmo.sendTextMessage('12243109030', phoneNumber, message, {}, function(err, data) {
		if (err) {
			defer.reject(err);
		} else if (!data.messages || data.messages.length < 1) {
			defer.reject('unable to find nexmo return status '+JSON.stringify(data));
		} else if (data.messages[0].status !== '0') {
			defer.reject('bad status code from nexmo '+JSON.stringify(data));
		} else {
			defer.resolve(data);
		}
	});
	return defer.promise;
};

function sendJob(job) {
	return exports.send(job.phoneNumber, job.message);
}

exports.sendQueued = function(phoneNumber, message) {
	qM.add(qM.SMS_QUEUE, {phoneNumber:phoneNumber, message:message});
};

exports.registerHandlers = function() {
	qM.registerHandler(qM.SMS_QUEUE, sendJob);
};
