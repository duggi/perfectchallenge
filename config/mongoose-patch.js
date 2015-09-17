'use strict';

var mongoose = require('mongoose');
var q = require('q');
/*
 * Hack until mongoose 4.x can be used. Currently there is an error with meanjs and mongoose 4.x
 * See this: https://github.com/LearnBoost/mongoose/issues/1431
 */
mongoose.Document.prototype.savePromise = function () {
	var that = this;
	return q.Promise(function (resolve, reject) {
		that.save(function (err, item, numberAffected) {
			if (err) {
				reject(err);
			}
			resolve(item, numberAffected);
		});
	});
};

mongoose.Document.prototype.removePromise = function () {
	var that = this;
	return q.Promise(function (resolve, reject) {
		that.remove(function (err, item) {
			if (err) {
				reject(err);
			}
			resolve(item);
		});
	});
};

mongoose.Document.prototype.populatePromise = function (field) {
	var that = this;
	return q.Promise(function (resolve, reject) {
		that.populate(field, function (err, item) {
			if (err) {
				reject(err);
			}
			resolve(item);
		});
	});
};

