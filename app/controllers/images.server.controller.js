'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var DBImage = mongoose.model('Image');
var q = require('q');
var _ = require('lodash');
var l = require('../utils/logging');

exports.create = function(req) {
	var image = new DBImage(req.body);
	return image.savePromise();
};

exports.read = function(req) {
	return req.image;
};

exports.update = function(req) {
	var image = req.image ;
	image = _.extend(image , req.body);
	return image.savePromise();
};

exports.delete = function(req) {
	var image = req.image ;
	return image.removePromise();
};

exports.list = function(req) {
	return DBImage.find(req.body).exec();
};

exports.imageByID = function(req, id) {
	return DBImage.findById(id).exec();
};
