(function() {
'use strict';
/*globals angular,webkitAudioContext,console*/
/*jshint newcap: false */

/*
TODO:

Implement UI for displaying play status per bumper
--Different colors/indicators for background and looping tracks

Extend bumper edit UI

Implement as Chrome App (with offline support)

Fix issue where clicking Edit also starts the bumper

Should a board-sharing feature be implemented? Would need a way of transferring tracks, too, once local loading is implemented
--could possibly use cloud storage APIs (dropbox, Google Drive, etc)
*/

var controllerModule = angular.module('bumperBoard.controllers', ['bumperBoard.services']);

controllerModule.controller('BoardCtrl', ['$scope', '$http', '$timeout', function BoardCtrl($scope, $http, $timeout) {
	$scope.audioContext = new webkitAudioContext();
	
	$scope.bumpersLoaded = false;
	$scope.showBoardSelectUI = false;
	$scope.showNewBoardUI = false;
	$scope.showBumperEditUI = false;
	
	$scope.newTitle = '';
	$scope.newRows = 1;
	$scope.newCols = 1;
	
	$scope.createBoard = function() {
		var newBoard = {
			"title": $scope.newTitle,
			"rows": $scope.newRows,
			"cols": $scope.newCols,
			"bumpers": []
		};
		
		for(var i=0; i<$scope.newRows*$scope.newCols; i++) {
			newBoard.bumpers.push({
				"label": "",
				"src": "",
				"trackStart": 0,
				"fadeIn": 0,
				"background": false,
				"loop": false,
				"loopStart": 0,
				"loopEnd": 0,
				"volume": 1.0,
				"goTo": -1,
				"goToDelay": 0
			});
		}
		
		
		$scope.boards.push(newBoard);
		$scope.changeBoard($scope.boards.length-1);
		
		$scope.showBoardSelectUI = false;
		$scope.showNewBoardUI = false;

		$scope.newTitle = '';
		$scope.newRows = 1;
		$scope.newCols = 1;
	};
	
	$scope.changeBoard = function(i) {
		if($scope.board != $scope.boards[i]) {
			$scope.stopAll();
			
			$scope.bumpersLoaded = false;
			$scope.board = $scope.boards[i];
			
			//Setting a timeout of 0 allows the current call stack to complete and the BumperCtrl's
			//to be loaded before referenced within this call
			$timeout($scope.loadBumperSources, 0);
		}
		
		$scope.showBoardSelectUI = false;
	};
	
	$scope.loadBumperSources = function() {
		if(!$scope.bumpersLoaded) {
			for(var i in $scope.board.bumpers) {
				if($scope.board.bumpers[i].src !== '') {
					$scope.getBumperScope(i).init();
				} else {
					$scope.checkBoardLoadComplete();
				}
			}
		}
	};
	
	$scope.checkBoardLoadComplete = function() {
		var loaded = true;
		
		for(var i in $scope.board.bumpers) {
			if($scope.board.bumpers[i].src !== '' && (typeof $scope.board.bumpers[i].buffer == 'undefined' || $scope.board.bumpers[i].buffer === null)) {
				loaded = false;
			}
		}
		
		$scope.bumpersLoaded = loaded;
	};
	
	$scope.stopAll = function() {
		if($scope.board) {
			for(var i in $scope.board.bumpers) {
				if($scope.board.bumpers[i].playing) {
					$scope.getBumperScope(i).stop();
				}
			}
		}
	};
	
	$scope.editBumper = function(b) {
		var props = ["label", "src", "trackStart", "fadeIn", "background", "loop", "loopStart", "loopEnd", "volume"];
		$scope.editingBumper = {};
		for(var i in props) {
			$scope.editingBumper[props[i]] = $scope.board.bumpers[b][props[i]];
		}
		$scope.editingBumperIndex = b;
		$scope.showBumperEditUI = true;
	};
	
	$scope.saveBumper = function() {
		var rerunInit = false;
		if($scope.editingBumper.src !== $scope.board.bumpers[$scope.editingBumperIndex].src) {
			if($scope.board.bumpers[$scope.editingBumperIndex].playing) {
				$scope.getBumperScope($scope.editingBumperIndex).stop();
			}
			
			$scope.board.bumpers[$scope.editingBumperIndex].buffer = null;
			
			rerunInit = true;
		}
		
		var props = ["label", "src", "trackStart", "fadeIn", "background", "loop", "loopStart", "loopEnd", "volume"];
		for(var i in props) {
			$scope.board.bumpers[$scope.editingBumperIndex][props[i]] = $scope.editingBumper[props[i]];
		}
		
		if(rerunInit) {
			$scope.bumpersLoaded = false;
			
			$scope.getBumperScope($scope.editingBumperIndex).init();
		}
		
		$scope.editingBumper = {};
		
		$scope.showBumperEditUI = false;
	};
	
	$scope.getBumperScope = function(i) {
		return angular.element('#bumper-' + i).scope();
	};
	
	$scope.getDefaultBoards = function() {
		$http.get('defaultboards.json').success(function(d) {
			$scope.boards = d;
			
			$scope.changeBoard(0);
			
			localStorage.boards = JSON.stringify($scope.boards);
		});
	};

	if(localStorage.boards === "" || typeof localStorage.boards === "undefined") {
		$scope.getDefaultBoards();
	} else {
		$scope.boards = JSON.parse(localStorage.boards);
		
		$scope.changeBoard(0);
	}


}]);

controllerModule.controller('BumperCtrl', ['$scope', '$http', '$timeout', 'audioDecoder', '$window', function BumperCtrl($scope, $http, $timeout, audioDecoder, $window) {
	$scope.init = function(i) {
		audioDecoder.loadFromURL($scope.bumper.src).then(function(buffer) {
			$scope.bumper.buffer = buffer;
			$scope.bumper.playing = false;
			
			angular.element('#board').scope().checkBoardLoadComplete();
		}, function(err) {
			$window.alert(err);
		});
	};
	
	$scope.startTrack = function() {
		if($scope.bumper.src !== '') {
			if(!$scope.bumper.playing) {
				var i;
				//if this is a background track, only stop other background tracks
				if($scope.bumper.background) {
					for(i in $scope.board.bumpers) {
						if($scope.board.bumpers[i] !== $scope.bumper && $scope.board.bumpers[i].background && 
								$scope.board.bumpers[i].playing) {
							$scope.getBumperScope(i).stop();
						}
					}
				} else {
					//stop all other non-background tracks
					for(i in $scope.board.bumpers) {
						if($scope.board.bumpers[i] !== $scope.bumper && !$scope.board.bumpers[i].background && 
								$scope.board.bumpers[i].playing) {
							$scope.getBumperScope(i).stop();
						}
					}
				}
				
				$scope.play();
			} else {
				$scope.stop();
			}
		}
	};
	
	$scope.play = function() {
		var source = $scope.audioContext.createBufferSource();
		var gain = $scope.audioContext.createGainNode();
		
		source.buffer = $scope.bumper.buffer;
		source.connect(gain);
		gain.connect($scope.audioContext.destination);
		
		source.loop = $scope.bumper.loop;
		source.loopStart = $scope.bumper.loopStart;
		source.loopEnd = $scope.bumper.loopEnd;
		
		gain.gain.linearRampToValueAtTime(0, $scope.audioContext.currentTime);
		gain.gain.linearRampToValueAtTime($scope.bumper.volume, $scope.audioContext.currentTime + $scope.bumper.fadeIn);
		
		$scope.bumper.audioSource = source;
		
		//TrackStart parameter of .start is broken on current Chrome Stable. Catch error and retry without it
		try {
			source.start(0, $scope.bumper.trackStart);
		} catch(e) {
			source.start(0);
		}
		
		$scope.bumper.playing = true;
		
		if(!$scope.bumper.loop) {
			//schedule a timeout for a second before the track should end to poll for when it completes
			var totalDuration = $scope.bumper.buffer.duration - $scope.bumper.trackStart - 1;
			$timeout($scope.checkTrackEnd, Math.max(totalDuration*1000, 0));
		}
	};
	
	$scope.stop = function() {
		$scope.bumper.audioSource.stop(0);
		$scope.bumper.audioSource = null;
		
		$scope.bumper.playing = false;
	};

	
	//start playback of next track if one is defined in the bumper
	//TODO: refactor to use Web Audio API's native scheduling instead of imprecise browser timeouts
	$scope.goToNextTrack = function() {
		if(typeof $scope.bumper.goTo !== "undefined" && $scope.bumper.goTo !== -1) {
			$timeout(function() {
				$scope.getBumperScope($scope.bumper.goTo).startTrack();
			}, (typeof $scope.bumper.goToDelay == "undefined" ? 0 : $scope.bumper.goToDelay*1000));
		}
	};
	
	
	$scope.checkTrackEnd = function() {
		if($scope.bumper.audioSource && $scope.bumper.audioSource.playbackState === 3) {
			//playback has finished, call stop() (cleans up) and start next track (if applicable)
			$scope.stop();
			$scope.goToNextTrack();
		} else if($scope.bumper.audioSource) {
			//hasn't finished yet, so wait 50ms and check again
			$timeout($scope.checkTrackEnd, 50);
		}
	};
}]);


})();