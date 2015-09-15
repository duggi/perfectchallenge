'use strict';

//Setting up route
angular.module('players').config(['$stateProvider',
	function($stateProvider) {
		// Players state routing
		$stateProvider.
		state('players', {
			url: '/',
			templateUrl: 'modules/players/views/players.client.view.html'
		});
	}
]);
