'use strict';
/**
 * Module dependencies.
 */
var	mongoose = require('mongoose');
var	q = require('q');
var jackrabbit = require('jackrabbit');

exports.db = null;

exports.queue = null;

exports.connect = function(dbUrl, rabbitUrl) {
	var dbPromise = q.Promise(function (resolve, reject) {
		exports.db = mongoose.connect(dbUrl, function(err) {
			if (err) {
				console.error('\x1b[31m', 'Could not connect to MongoDB!');
				console.log(err);
				reject(err);
			} else {
				resolve();
			}
		});
	});
	var queuePromise = q.Promise(function (resolve, reject) {
		exports.queue = jackrabbit(rabbitUrl)
			.on('connected', function() {
				resolve();
			})
			.on('error', function(err) {
				if (err) {
					console.error('\x1b[31m', 'Could not connect to jack rabbit!');
					console.log(err);
				}
				reject();
			});
	});
 	return q.all([dbPromise, queuePromise]);
};
