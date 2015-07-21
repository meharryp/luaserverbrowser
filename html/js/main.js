var app = angular.module('lsbApp', []);

app.controller('serverBrowser', function($scope) {
	$scope.loading = false;
	$scope.serverResults = [];
	$scope.prettyResults = [];
	$scope.resultsLength = 0;
	
	$scope.loadingBarStyle = function() {
		var frac = ($scope.serverResults.length || 0) / ($scope.resultsLength || 0);
		
		return {
			'width': (frac * 100) + '%',
			'background': 'hsla(' + Math.ceil(frac * 360) + ', 80%, 60%, 1)'
		}
	}
	
	var serverTypes = {'100': 'Dedicated', '108': 'Listen', '112': 'SourceTV'}
	var serverEnvs = {'108': 'Linux', '119': 'Windows', '109': 'OSX', '111': 'OSX'}
	
	$scope.viewServer = function($index) {
		var curServer = $scope.curServer = $scope.serverResults[$index];
		
		if(!curServer.rules) 
			lsb.getServerRules(curServer.info.ip, curServer.info.port, $index);
		
		if(!curServer.players)
			lsb.getServerPlayers(curServer.info.ip, curServer.info.port, $index);
		
		
		if(!curServer.prettyInfo) {
			var info = curServer.info;
			
			curServer.prettyInfo = [
				{key: 'VAC enabled', value: !!info.VAC},
				{key: 'Password protected', value: !!info.pass},
				{key: 'Players', value: info.numPlayers},
				{key: 'Bots', value:info.numBots},
				{key: 'Max players', value: info.maxPlayers},
				{key: 'Map', value: info.map},
				{key: 'Ping', value: info.ping},
				{key: 'Folder', value: info.folder},
				{key: 'Version', value: info.version},
				{key: 'App ID', value: info.appid},
				{key: 'Server type', value: serverTypes[info.type]},
				{key: 'Server environment', value: serverEnvs[info.env]}
			];
		}
	}
	
	$scope.joinServer = function(server) {
		lsb.joinServer(server.info.ip, server.info.port);
	}
	
	$scope.addResult = function(result) {
		$scope.serverResults.push(result);
		
		$scope.prettyResults.push({
			pass: 		result.info.pass,
			VAC: 		result.info.VAC,
			name: 		result.info.name,
			gamemode: 	result.info.gamemode,
			players: 	result.info.numPlayers + '/' + result.info.maxPlayers,
			map: 		result.info.map,
			ping: 		result.info.ping
		});
	}
	
	$scope.addRules = function(index, rules) {
		var ret = [];
		
		for(var key in rules) {
			if(rules.hasOwnProperty(key)) {
				ret.push({
					key: key,
					value: rules[key]
				});
			}
		}
		
		$scope.serverResults[index].rules = ret;
	}
	
	$scope.addPlayers = function(index, players) {
		var ret = [];
		
		if(players['1']) {
			for(var id in players) {
				if(players.hasOwnProperty(id)) {
					var ply = players[id];

					var info = {
						name: 	(ply.name.length > 0 ? ply.name : '<Connecting>'),
						score: 	ply.score
					}

					var sec = parseFloat(ply.time);
					var min = sec / 60;
					var hour = min / 60;

					info.time = 
						(hour >= 1 ? Math.floor(hour) + 'h ' : '') +
						(min >= 1 ? (Math.floor(min) % 60) + 'm ' : '') +
						(Math.floor(sec) % 60) + 's';

					ret.push(info);
				}
			}
		} else {
			ret = [{
				name: '',
				score: '',
				time: ''
			}];
		}
		
		$scope.serverResults[index].players = ret;
	}
	
	//settings
	
	$scope.settings = {
		region: {
			0x00: 'U.S. East coast',
			0x01: 'U.S. West coast',
			0x02: 'South America',
			0x03: 'Europe',
			0x04: 'Asia',
			0x05: 'Australia',
			0x06: 'Middle East',
			0x07: 'Africa',
			0xFF: 'Rest of the world'
		},
		query: [
			{label: 'Generic stuff', 		data: [
				{label: 'Dedicated', 			type: 'checkbox', 	category: 'master', key: 'type', 				trueValue: 'd'},
				{label: 'VAC', 					type: 'checkbox', 	category: 'master', key: 'secure'},
				{label: 'Server empty', 		type: 'checkbox', 	category: 'master', key: 'noplayers'},
				{label: 'Server has players', 	type: 'checkbox', 	category: 'master', key: 'empty'},
				{label: 'Server not full', 		type: 'checkbox', 	category: 'master', key: 'full'},
				{label: 'Whitelisted', 			type: 'checkbox', 	category: 'master', key: 'white'}
			]},
			{label: 'Specific stuff', 		data: [
				{label: 'Map', 					type: 'text', 		category: 'master', key: 'map'},
				{label: 'Hostname', 			type: 'text', 		category: 'master',	key: 'name_match'},
				{label: 'IP Address', 			type: 'text', 		category: 'master',	key: 'gameaddr'}
			]},
			{label: 'Probably useless', 	data: [
				{label: 'Game directory', 		type: 'text', 		category: 'master', key: 'gamedir'},
				{label: 'Linux', 				type: 'checkbox', 	category: 'master', key: 'linux'},
				{label: 'Spectator server', 	type: 'checkbox', 	category: 'master', key: 'proxy'},
				{label: 'App ID', 				type: 'text', 		category: 'master', key: 'appid',		 		isNumber: true},
				{label: 'Version', 				type: 'text', 		category: 'master', key: 'version_match', 		isNumber: true},
				{label: 'Collapse multiples', 	type: 'checkbox', 	category: 'master', key: 'collapse_addr_hash'}
			]}
		]
	};
	
	$scope.setRegion = function(v) {
		$scope.querySettings.master.region = v;
		$scope.regionSelect = false;
	}
	
	//the stuff we send to lua 
	
	$scope.querySettings = {
		master: {
			region: 			0xFF,
			
			type: 				0,
			secure: 			0,
			noplayers: 			0,
			empty:				0,
			full: 				0,
			white: 				0,
			
			map:				'',
			name_match: 		'',
			gameaddr: 			'',
			
			gamedir: 			'garrysmod',
			linux: 				0,
			proxy: 				0,
			appid:				4000,
			version_match: 		'',
			collapse_addr_hash: 0
		},
		server: {
			
		}
	};
	
	$scope.fetchServers = function() {
		var json = JSON.stringify($scope.query);
		
		console.log(json);
		
		lsb.getServers(json);
	}
});

app.directive('sortable', function($rootScope) {
	return {
		restrict: 'E',
		templateUrl: 'sortable-template.html',
		scope: {
			object: '=',
			show: '=',
			click: '&'
		},
		link: function(scope, elem, attr) {
			scope.data = [];
			scope.keys = [];
			
			var badKeys = {'$$hashKey': true, '_index': true}
			
			//????			
			scope.$watch('object', function(data) {
				if(!data) return;
				
				scope.data = data;
				
				if(data.length) {
					scope.keys = Object.keys(data[0]);
				
					//add indices
					if(!data[0]._index) {
						for(var i = 0; i < data.length; i++) {
							scope.data[i]._index = i;
						}
					}
					
					//get rid of our _index and angular's $$hashkey
					for(var i = scope.keys.length - 1; i > -1; i--) {
						if(badKeys[scope.keys[i]])
							scope.keys.splice(i, 1);
					}
				}
			}, true);
			
			//isolated scope breaks ng-show pre 1.3
			if(attr.show) {
				scope.$watch('show', function(val) {
					if(val)
						elem[0].style.display = '';
					else 
						elem[0].style.display = 'none';
				});
			}
			
			//now for the fun stuff
			
			scope.reverse = false;
			scope.key = '';
			
			scope.sortBy = function(key) {
				if(scope.key === key)
					scope.reverse = !scope.reverse;
				else {
					scope.key = key;
					scope.reverse = false;
				}

				scope.data.sort(function(a, b) {
					var comp = 0;
					
					var foo = a[key].toString().toLowerCase();
					var bar = b[key].toString().toLowerCase();

					if(foo > bar)
						comp = 1;
					else if(bar > foo)
						comp = -1;

					return comp * (scope.reverse ? -1 : 1);
				});
			}
		}
	}
});