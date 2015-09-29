'use strict';

angular.module('players').controller('PlayersController', ['$scope', '$http', '$state', '$stateParams',
	function($scope, $http, $state, $stateParams) {
		$scope.allWeeks = ['overall', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
		function fetchStats(week) {
			$scope.loading = true;
			$http.get('/scrape/perfectchallenge?week='+week).then(function(response) {
				$scope.players = response.data.players;
				$scope.selectedWeek = response.data.week;
				$scope.overall = response.data.overall;
				if ($scope.overall) {
					$scope.selectedWeek = 'overall';
				}
				$scope.loading = false;
			});
		}
		$scope.changeWeek = function() {
			$state.go('players', {week:$scope.selectedWeek});
		};
		var week = $stateParams.week || '';
		fetchStats(week);
	}
]);
