'use strict';

var pH = require('../../app/utils/promiseHandler');

module.exports = function(app) {
	var images = require('../../app/controllers/images');
	pH.addStandardRoutes(app, 'image', 'images', images);
};
