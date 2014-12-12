(function() {
'use strict';
/*globals angular,webkitAudioContext,console*/
/*jshint newcap: false */

var controllerModule = angular.module('bumperBoard.controllers', ['bumperBoard.services', 'fileSystem', 'ui.bootstrap']);

controllerModule.controller('BoardCtrl', ['$scope', '$http', '$timeout', '$q', 'fileSystem', function BoardCtrl($scope, $http, $timeout, $q, fileSystem) {
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
				"filename": "",
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
				if($scope.board.bumpers[i].filename !== '') {
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
			if($scope.board.bumpers[i].filename !== '' && (typeof $scope.board.bumpers[i].buffer == 'undefined' || $scope.board.bumpers[i].buffer === null)) {
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
	
	$scope.editBumper = function(b, $event) {
		$event.preventDefault();
		$event.stopPropagation();
		
		var props = ["label", "filename", "trackStart", "fadeIn", "background", "loop", "loopStart", "loopEnd", "volume", "goTo", "goToDelay"];
		$scope.editingBumper = {};
		for(var i in props) {
			$scope.editingBumper[props[i]] = $scope.board.bumpers[b][props[i]];
		}
		$scope.editingBumperIndex = b;
		$scope.showBumperEditUI = true;
	};
	
	$scope.setEditFile = function(element) {
		$scope.$apply(function($scope) {
			$scope.editingBumper.file = element.files[0];
			$scope.editingBumper.filename = $scope.editingBumper.file.name;
		});
	};
	
	$scope.saveBumper = function() {
		var rerunInit = false;
		if($scope.editingBumper.filename !== $scope.board.bumpers[$scope.editingBumperIndex].filename) {
			if($scope.board.bumpers[$scope.editingBumperIndex].playing) {
				$scope.getBumperScope($scope.editingBumperIndex).stop();
			}
			
			$scope.board.bumpers[$scope.editingBumperIndex].buffer = null;
			
			rerunInit = true;
		}
		
		var props = ["label", "filename", "trackStart", "fadeIn", "background", "loop", "loopStart", "loopEnd", "volume", "goTo", "goToDelay"];
		for(var i in props) {
			$scope.board.bumpers[$scope.editingBumperIndex][props[i]] = $scope.editingBumper[props[i]];
		}
		
		if(rerunInit) {
			$scope.bumpersLoaded = false;
			
			var folderName = $scope.boardFolderName($scope.board.title);
			var filename = 'bumper-board/' + folderName + '/' + $scope.editingBumper.filename;
			
			fileSystem.writeFileInput(filename, $scope.editingBumper.file, "audio/mpeg").then(function() {
				$scope.getBumperScope($scope.editingBumperIndex).init();
			});
		}
		
		$scope.editingBumper = {};
		
		$scope.saveBoard($scope.board);
		
		$scope.showBumperEditUI = false;
	};
	
	$scope.getBumperScope = function(i) {
		return angular.element('#bumper-' + i).scope();
	};
	
	$scope.boardFolderName = function(title) {
		return title.toLowerCase().replace(/[^a-z0-9\s\-]/g, "").replace(/\s+/, '-');
	};
	
	$scope.getDefaultBoards = function() {
		$http.get('defaultboards.json').success(function(d) {
			var savePromises = [];
			
			for(var i=0; i<d.length; i++) {
				var board = d[i];
				
				for(var j=0; j<board.bumpers.length; j++) {
					var bumper = board.bumpers[j];
					bumper.filename = bumper.src.substr(bumper.src.lastIndexOf('/')+1);
				}
				
				savePromises.push($scope.saveBoard(board));
				savePromises.push($scope.downloadBumpers(board));
			}
			
			$q.all(savePromises).then(function() {
				$scope.loadBoards();
			}, function(err) {
				console.log(err);
			});
		});
	};
	
	$scope.downloadBumpers = function(board) {
		var folderName = $scope.boardFolderName(board.title);
		
		var def = fileSystem.createFolder('bumper-board/' + folderName).then(function() {
			var writePromises = [];
			
			var writeBumper = function(bumper) {
				var writePromise = $http.get(bumper.src, {responseType: 'arraybuffer'}).success(function(data) {
					return fileSystem.writeArrayBuffer('bumper-board/' + folderName + '/' + bumper.filename, data, "audio/mpeg");
				});
				
				return writePromise;
			};
			
			for(var i=0; i<board.bumpers.length; i++) {
				writePromises.push(writeBumper(board.bumpers[i]));
			}
			
			return $q.all(writePromises);
		});
		
		return def;
	};
	
	$scope.saveBoard = function(board) {
		var folderName = $scope.boardFolderName(board.title);
		
		var def = fileSystem.createFolder('bumper-board/' + folderName).then(function() {
			return fileSystem.writeText('bumper-board/' + folderName + '/board.json', JSON.stringify(board));
		});
		
		return def;
	};
	
	$scope.loadBoard = function(path) {
		var def = fileSystem.readFile(path + '/board.json').then(function(board) {
			return JSON.parse(board);
		});
		
		return def;
	};
	
	$scope.loadBoards = function() {
		//$scope.boards = JSON.parse(localStorage.boards);
		
		//$scope.changeBoard(0);
		
		fileSystem.getFolderContents('bumper-board').then(function(entries) {
			var boardLoading = [];
			for(var i=0; i<entries.length; i++) {
				if(entries[i].isDirectory) {
					boardLoading.push($scope.loadBoard(entries[i].fullPath));
				}
			}
			
			return $q.all(boardLoading);
		}).then(function(boards) {
			if(boards.length > 0) {
				$scope.boards = boards;
				
				$scope.changeBoard(0);
			} else {
				console.log("No boards returned");
				$scope.getDefaultBoards();
			}
		}, function(err) {
			console.log(err);
			$scope.getDefaultBoards();
		});
	};
	
	$scope.init = function() {
		fileSystem.requestQuotaIncrease(100).then(function() {
			$scope.loadBoards();
		});
	};
	
	$scope.init();
}]);

controllerModule.controller('BumperCtrl', ['$scope', '$http', '$timeout', 'audioDecoder', '$window', 'fileSystem', function BumperCtrl($scope, $http, $timeout, audioDecoder, $window, fileSystem) {
	$scope.init = function() {
		var bufferLoadPromise;
		
		if($scope.bumper.filename) {
			var folderName = $scope.boardFolderName($scope.board.title);
			
			bufferLoadPromise = fileSystem.readFile('bumper-board/' + folderName + '/' + $scope.bumper.filename, "arraybuffer").then(function(data) {
				return audioDecoder.loadFromArrayBuffer(data);
			});
		} else {
			bufferLoadPromise = audioDecoder.loadFromURL($scope.bumper.src);
		}
		
		bufferLoadPromise.then(function(buffer) {
			$scope.bumper.buffer = buffer;
			$scope.bumper.playing = false;
			
			angular.element('#board').scope().checkBoardLoadComplete();
		}, function(err) {
			$window.alert(err);
		});
	};
	
	$scope.startTrack = function() {
		if($scope.bumper.filename !== '') {
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
		var gain = $scope.audioContext.createGain();
		
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
		if(typeof $scope.bumper.goTo !== "undefined" && $scope.bumper.goTo != -1) {
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
