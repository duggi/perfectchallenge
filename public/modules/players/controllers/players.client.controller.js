'use strict';

angular.module('players').controller('PlayersController', ['$scope', '$http', '$state', '$stateParams',
	function($scope, $http, $state, $stateParams) {
		$scope.allStats = ['overall', 'weekly', 'divisions', 'divisionsByWeek', 'bonus', 'bonusByWeek', 'gender', 'genderByWeek'];
		$scope.allWeeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
		function fetchStats() {
			$scope.loading = true;
			var url = '/scrape/perfectchallenge?';
			if ($stateParams.stat) {
				url += '&stat='+$stateParams.stat;
			}
			if ($stateParams.week) {
				url += '&week='+$stateParams.week;
			}
			if ($stateParams.bonus) {
				url += '&bonus='+$stateParams.bonus;
			}
			$http.get(url).then(function(response) {
				$scope.players = response.data.players;
				$scope.stat = response.data.stat;
				if (response.data.week) {
					$scope.week = response.data.week;
				}
				$scope.bonus = response.data.bonus || false;
				ga('send', 'event', $scope.stat, $scope.week, $scope.bonus);
				$scope.loading = false;
			});
		}
		$scope.changeStat = function() {
			var newStateParams = {
				stat:$scope.stat, bonus:$scope.bonus
			};
			if ($scope.week && $scope.stat.toLocaleLowerCase().indexOf('week')!==-1) {
				newStateParams.week = $scope.week;
			} else {
				newStateParams.week = '';
			}
			if ($scope.stat === 'bonus' || $scope.stat === 'bonusByWeek') {
				newStateParams.bonus = '';
			}
			$state.go('players', newStateParams);
		};
		fetchStats();
	}
]);
