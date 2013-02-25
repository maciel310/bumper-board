'use strict';


// Declare app level module which depends on filters, and services
angular.module('bumperBoard', ['bumperBoard.services', 'bumperBoard.controllers']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/board', {templateUrl: 'partials/board.html', controller: 'BoardCtrl'});
    $routeProvider.otherwise({redirectTo: '/board'});
  }]);
