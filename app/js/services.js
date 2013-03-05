(function() {
'use strict';
/*globals angular,webkitAudioContext,console*/
/*jshint newcap: false */


/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
var serviceModule = angular.module('bumperBoard.services', ['fileSystem']);

serviceModule.factory('audioDecoder', ['$http', '$q', function($http, $q) {
	var audioContext = new webkitAudioContext();
	
	var audioDecoder = {
		loadFromURL: function(src) {
			var def = $q.defer();
			
			$http.get(src, {responseType: 'arraybuffer'}).success(function(data) {
				console.log("Request Complete");
				
				audioDecoder.fromArrayBuffer(data, def);
			}).error(function() {
				def.reject("Error with HTTP Request");
			});
			
			return def.promise;
		},
		fromArrayBuffer: function(data, def) {
			audioContext.decodeAudioData(data, function(buffer) {
				console.log("Decoding Complete");
				
				def.resolve(buffer);
				
				angular.element('#board').scope().$apply();
			}, function onError(e) {
				def.reject("Error decoding audio stream");
			});
		}
	};
	
	return audioDecoder;
}]);

})();
