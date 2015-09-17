'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');
var Schema = mongoose.Schema;

var PlayerPageSchema = new Schema({
	week: {
		type: Number,
		require:true
	},
	players: [{
		type: Schema.Types.Mixed
	}]
});

PlayerPageSchema.plugin(timestamps);
mongoose.model('PlayerPage', PlayerPageSchema);
