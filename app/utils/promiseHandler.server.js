'use strict';
(function () {
	var q = require('q');
	var l = require('./logging');

	/*
	 fn: is a function that takes a request and returns a promise.
	 Sends the resolution of the promise as a jsonp response and handles errors.
	 */
	exports.jsonp = function (fn, afterSuccess) {
		return function (req, res, next) {
			//l('request ', req.body);
			var promise = fn(req, res.locals);
			//wrap in a promise in case a value was returned.
			promise = q.Promise(function (resolve) {
				resolve(promise);
			});
			promise.then(function (data) {
				if (afterSuccess) {
					afterSuccess(req, res, data);
				}
				//l('response ', data);
				// should check if json data has changed
				res.header('Cache-Control', 'must-revalidate');
				res.jsonp(data);
			}, function (err) {
				next(err);
			});
		};
	};

	/*
	 fn: is a function that takes a request, id and returns a promise.
	 adds the resolution of promise to the request.
	 */
	exports.param = function (fn, key) {
		return function (req, res, next, id) {
			var promise = fn(req, id, res.locals);
			//wrap in a promise in case a value was returned.
			promise = q.Promise(function (resolve) {
				resolve(promise);
			});
			promise.then(function (data) {
				if (!data) {
					next(new Error('Failed to load ' + key + ' for ' + id));
				} else {
					req[key] = data;
					next();
				}
			}, function (err) {
				next(err);
			});
		};
	};

	/*
	 fn: is a function that takes a request and returns a promise.
	 adds the resolution of promise to the request.
	 */
	exports.render = function (fn, viewName) {
		return function (req, res, next) {
			var promise = fn(req);
			//wrap in a promise in case a value was returned.
			promise = q.Promise(function (resolve) {
				resolve(promise);
			});
			promise.then(function (data) {
				res.render(viewName, data);
			}, function (err) {
				next(err);
			});
		};
	};

	exports.middleware = function(fn) {
		return function(req, res, next) {
			var promise = fn(req);
			promise = q.Promise(function (resolve) {
				resolve(promise);
			});
			promise.then(function() {
				next();
			}, function (err) {
				next(err);
			});
		};
	};

	exports.addStandardRoutes = function(app, typeNameSingular, typeNamePlural, typeControllers, requiresLogin) {
		var typeId = typeNameSingular+'Id';
		if (!requiresLogin) {
			requiresLogin = function(req, res, next) {
				next();
			};
		}
		app.route('/'+typeNamePlural)
			.get(exports.jsonp(typeControllers.list))
			.post(requiresLogin, exports.jsonp(typeControllers.create));

		app.route('/'+typeNamePlural+'/:'+typeId)
			.get(exports.jsonp(typeControllers.read))
			.put(requiresLogin, exports.jsonp(typeControllers.update))
			.delete(requiresLogin, exports.jsonp(typeControllers.delete));

		// Finish by binding the middleware
		app.param(typeId, exports.param(typeControllers[typeNameSingular+'ByID'], typeNameSingular));
	};


})();

