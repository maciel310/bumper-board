(function() {
'use strict';
/*globals angular,webkitAudioContext,console*/
/*jshint newcap: false */

var serviceModule = angular.module('bumperBoard.services', ['fileSystem']);

serviceModule.factory('audioDecoder', ['$http', '$q', '$timeout', function($http, $q, $timeout) {
	var audioContext = new webkitAudioContext();
	
	//wrap resolve/reject in an empty $timeout so it happens within the Angular call stack
	//easier than .apply() since no scope is needed and doesn't error if already within an apply
	function safeResolve(deferral, message) {
		$timeout(function() {
			deferral.resolve(message);
		});
	}
	function safeReject(deferral, message) {
		$timeout(function() {
			deferral.reject(message);
		});
	}
	
	var audioDecoder = {
		loadFromURL: function(src) {
			var def = $http.get(src, {responseType: 'arraybuffer'}).then(function(req) {
				console.log("Request Complete");
				
				return audioDecoder.fromArrayBuffer(req.data);
			}, function(err) {
				return $q.reject("Error downloading bumper");
			});
			
			return def;
		},
		fromArrayBuffer: function(data) {
			var def = $q.defer();
			
			audioContext.decodeAudioData(data, function(buffer) {
				console.log("Decoding Complete");
				
				safeResolve(def, buffer);
			}, function onError(e) {
				safeReject(def, "Error decoding audio stream");
			});
			
			return def.promise;
		}
	};
	
	return audioDecoder;
}]);

})();
