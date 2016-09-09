'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var timestamps = require('mongoose-timestamp');

/**
 * Image Schema
 */
var ImageSchema = new Schema({
	caption: {
		type: String,
		default: '',
		required: 'Please fill Image name',
		trim: true
	},
	publicId : {
		type: String,
		require: true
	}
});

ImageSchema.plugin(timestamps);

mongoose.model('Image', ImageSchema);
