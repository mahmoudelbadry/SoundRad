'use strict';

angular.module('soundrad.controllers', [])


.controller('PlayerCtrl', ['$scope', 'player', 'audio', function($scope, player, audio) {

    $scope.player = player;
    $scope.audio = audio;

    Mousetrap.bind(['j', 'shift+right'], function(){
      $scope.$apply(function(){
        player.next();
      });
    });
    Mousetrap.bind(['k', 'shift+left'], function(){
      $scope.$apply(function(){
        player.prev();
      });
    });
    Mousetrap.bind('space', function(e) {
      e.preventDefault();
      $scope.$apply(function(){
        player.toggle();
      });
    });

}])

.controller('HeadCtrl', ['$scope', 'player', function($scope, player) {
  $scope.title = function() {
    if (player.playing) {
      return '► ' + player.tracks[player.i].title + ' | SoundRad';
    } else if (player.paused) {
      return player.tracks[player.i].title + ' | SoundRad';
    } else {
      return 'SoundRad';  
    };
  };
}])
  
.controller('ScrubberCtrl', ['$scope', 'audio', function($scope, audio) {
  function updateView() {
    $scope.$apply(function() {
      $scope.currentBufferPercentage = ((audio.buffered.length && audio.buffered.end(0)) / audio.duration) * 100;
      $scope.currentTimePercentage = (audio.currentTime / audio.duration) * 100;
      $scope.currentTimeMS = (audio.currentTime * 1000).toFixed();
      $scope.durationMS = (audio.duration * 1000).toFixed();
    });
  };  
  audio.addEventListener('timeupdate', updateView, false);
  $scope.seekTo = function($event){
    var xpos = $event.offsetX / $event.target.offsetWidth;
    audio.currentTime = (xpos * audio.duration);
  };
}])
  
.controller('NavCtrl',
  ['$scope', '$stateParams', '$state', '$window', '$location', 'soundcloud', 'storage',
  function($scope, $stateParams, $state, $window, $location, soundcloud, storage) {

  // Defaults
  $scope.viewUser = null;
  $scope.userData = null;

  $scope.page = 1;
  $scope.pageSize = 16;
  $scope.pageOffset = 0;

  $scope.version = storage.get('version');
    
  // Get token from url hash
  if($location.hash()){
    var token = $location.hash().replace('#','').split('&')[0].split('=')[1];
    if(token) {
      console.log('setting oauth token based on hash...');
      storage.set('token', token);
    };
  };

  $scope.token = storage.get('token');
  $scope.me = storage.get('me');

  if(!$scope.version){
    console.log('Reseting localStorage - version 64'); storage.clearAll(); $scope.version = 64; storage.set('version', $scope.version);
  };
  if($scope.version != 64){
    console.log('Setting version to 64'); localStorage.removeItem('bookmarks'); localStorage.removeItem('theme'); $scope.version = 64; storage.set('version', $scope.version);
  };
  
  var getUserPlaylists = function(){
    soundcloud.getUserPlaylists(function(data){
      $scope.$apply(function(){
        $scope.userPlaylists = data;
      });
    });
  };

  if ($scope.token){
    soundcloud.reconnect($scope.token);
    soundcloud.me(function(me){
      $scope.me = me;
      storage.set('me', me);
      getUserPlaylists();
    });
  };

  $scope.connect = function() {
    soundcloud.connect();
  };
  
  $scope.logOut = function() {
    storage.clearAll();
    $window.location.href = '/';
  };
    
  $scope.$stateParams = $stateParams;
  
  $scope.$on('$stateChangeSuccess', function(){
    $scope.currentState = $state.current.name;
    $scope.viewUser = $stateParams.user;
  });

  // Turn this into a directive for anchor tags
  $scope.preloadContent = null;
  $scope.preload = function(url, data) {
    $location.hash('');
    $location.path(url);      
    $scope.preloadContent = data;
  };
  
  $scope.getPage = function() {
    if ($location.hash() && !isNaN($location.hash())){
      $scope.page = parseFloat($location.hash());
      $scope.pageOffset = ($scope.page - 1) * $scope.pageSize;
    } else {
      $scope.page = 1;
      $scope.pageOffset = 0;
    };
    $scope.getParams = { limit: $scope.pageSize, offset: $scope.pageOffset };
  };
  $scope.getPage();

  var modalIsOpen = false; 
  var toggleShortcutsHelper = function() {
    $scope.$apply(function(){
      if(!modalIsOpen) $scope.modalContent = '/partials/_keyboard-shortcuts.html';
      else $scope.modalContent = null;
    });
    modalIsOpen = !modalIsOpen;
  };

  $scope.closeModal = function(){
    $scope.modalContent = null;
    modalIsOpen = false;
  };

  Mousetrap.bind('?', function(){
    toggleShortcutsHelper();
  });

  Mousetrap.bind('esc', function(e){
    e.preventDefault();
    $scope.$apply(function(){
      $scope.modalContent = null;
      modalIsOpen = false;
    });
  });

  Mousetrap.bind('g s', function(){
    $scope.$apply(function(){
      $location.path('/');
    });
  });
  Mousetrap.bind('g m', function(){
    $scope.$apply(function(){
      $location.path('/' + $scope.me.permalink);
    });
  });
  Mousetrap.bind('g l', function(){
    $scope.$apply(function(){
      $location.path('/' + $scope.me.permalink + '/likes');
    });
  });
  Mousetrap.bind('g p', function(){
    $scope.$apply(function(){
      $location.path('/' + $scope.me.permalink + '/sets');
    });
  });
  Mousetrap.bind('/', function(e){
    e.preventDefault();
    $scope.$apply(function(){
      $location.path('/search');
    });
  });

}])
  
.controller('CallbackCtrl', ['$scope', '$location', function($scope, $location){
  $location.path('/');
}])
  
.controller('StreamCtrl', ['$scope', 'soundcloud', 'player', function($scope, soundcloud, player) {
  $scope.page = 1;
  $scope.isLoading = true;
  var url = '/me/activities/tracks';
  var params = { limit: $scope.pageSize };
  soundcloud.getStream(url, params, function(data, tracks){
    $scope.$apply(function(){
      $scope.tracks = tracks;
      $scope.hasPrevPage = false;
      $scope.hasNextPage = false;  
      $scope.isLoading = false;
      $scope.streamNextPage = data.next_href;
      if(!player.playing && !player.paused) {
        player.load($scope.tracks);
      };
    });
  });
}])
  
.controller('UserCtrl', ['$scope', 'soundcloud', '$stateParams', '$state', function($scope, soundcloud, $stateParams, $state) {
    $scope.isLoading = true;
    $scope.isSetsList = false;
    $scope.viewUser = $stateParams.user;
    soundcloud.getUser($scope.viewUser, function(data){
      $scope.$apply(function(){
        $scope.userData = data;
        $scope.viewUsername = data.username;
        //if($scope.me) $scope.isFollowing(data.id);
        $scope.followersCount = parseInt(data.followers_count);
        $scope.followingsCount = parseInt(data.followings_count);
      });
    });
    
    $scope.$state = $state;

    $scope.getTracks = function(){
      soundcloud.getTracks($scope.getUrl, $scope.getParams, function(data){
        $scope.$apply(function(){
          $scope.tracks = data;
          $scope.hasPrevPage = ($scope.pageOffset >= $scope.pageSize);
          $scope.hasNextPage = ($scope.tracks.length >= $scope.pageSize);
          $scope.isLoading = false;
        });
      });
    };
    
    $scope.$on('$stateChangeSuccess', function(){
      if ($state.current.name == 'user'){
        $scope.getUrl = '/users/' + $scope.viewUser + '/tracks';
        $scope.getPage();
        $scope.getTracks();
      };  
    });

    $scope.isFollowing = function(userid){
      console.log('checking if following...' + userid);
      soundcloud.isFollowing(userid, function(data, error){
        console.log('data:');
        console.log(data);
        if(error) console.error(error);
      });
    };

    $scope.follow = function(userid){
      soundcloud.follow(userid, function(data){
      });
    };
    $scope.unfollow = function(userid){
      soundcloud.unfollow(userid, function(data){
      });
    };
    
}])
  
.controller('LikesCtrl', ['$scope', 'soundcloud', function($scope, soundcloud){
    $scope.tracks = null;
    $scope.isLoading = true;
    $scope.getUrl = '/users/' + $scope.viewUser + '/favorites';
    $scope.getPage();
    soundcloud.getTracks($scope.getUrl, $scope.getParams, function(data){
      $scope.$apply(function(){
        $scope.tracks = data;
        $scope.hasPrevPage = ($scope.pageOffset >= $scope.pageSize);
        $scope.hasNextPage = ($scope.tracks.length >= $scope.pageSize);
        $scope.isLoading = false;
      });
    });
}])
  
.controller('SetsCtrl', ['$scope', 'soundcloud', function($scope, soundcloud){
    $scope.tracks = null;
    $scope.isLoading = true;
    $scope.isSetsList = true;
    $scope.getUrl = '/users/' + $scope.viewUser + '/playlists';
    $scope.getPage();
    if($scope.viewUser == $scope.me.permalink && $scope.userPlaylists) {
      $scope.tracks = $scope.userPlaylists;
    };
    soundcloud.getTracks($scope.getUrl, $scope.getParams, function(data){
      $scope.$apply(function(){
        $scope.tracks = data;
        $scope.hasPrevPage = ($scope.pageOffset >= $scope.pageSize);
        $scope.hasNextPage = ($scope.tracks.length >= $scope.pageSize);
        $scope.isLoading = false;
      });
    });
}])
  
.controller('TrackDetailCtrl', ['$scope', 'soundcloud', '$stateParams', 'player', function($scope, soundcloud, $stateParams, player){
  
  $scope.player = player;

  $scope.isLoading = true;
  if ($scope.preloadContent) {
    $scope.tracks = new Array($scope.preloadContent);
    $scope.track = $scope.preloadContent;
    $scope.preloadContent = null;
    $scope.isLoading = false;
  };
  
  var path = '/' + $scope.viewUser + '/' + $stateParams.track;
  soundcloud.getTrack(path, function(data){
    $scope.$apply(function () {
      $scope.tracks = new Array(data);
      $scope.track = data;
      $scope.hasPrevPage = false;
      $scope.hasNextPage = false;
      $scope.isLoading = false;
      if(!player.playing && !player.paused) player.load($scope.track);
    });
  });
}])
  
.controller('SetDetailCtrl', ['$scope', 'soundcloud', '$stateParams', 'player', function($scope, soundcloud, $stateParams, player){
  $scope.isLoading = true;
  if ($scope.preloadContent) {
    $scope.set = $scope.preloadContent;
    $scope.set.title = $scope.preloadContent.title;
    $scope.tracks = $scope.preloadContent.tracks;
    $scope.preloadContent = null;
    $scope.isLoading = false;
  };

  $scope.getSet = function(){
    var path = '/' + $scope.viewUser + '/sets/' + $stateParams.set;
    soundcloud.getSet(path, function(data){
      $scope.$apply(function () {
        $scope.set = data;
        $scope.tracks = data.tracks;
        $scope.hasPrevPage = false;
        $scope.hasNextPage = false;
        $scope.streamNextPage = false;
        $scope.isLoading = false;
        if(!player.playing && !player.paused) player.load($scope.tracks);
      });
    });
  };
  $scope.getSet();

  $scope.isEditable = false;
  $scope.toggleIsEditable = function(){ $scope.isEditable = !$scope.isEditable; };
  
  $scope.updatePlaylist = function(){
    if(player.tracks == $scope.set.tracks) {
      var i;
      for(i in $scope.set.tracks){
        if($scope.set.tracks[i].id == player.playing.id){
          player.i = parseInt(i);
          player.tracks = $scope.set.tracks;
        };
      };
    };
    soundcloud.updatePlaylist($scope.set, function(data){
    });
  };

  $scope.sortableOptions = { stop: function(e, ui) { $scope.updatePlaylist(); } }, { revert: true };

}])
  
.controller('InfoCtrl', ['$scope', 'soundcloud', function($scope, soundcloud){
}])
  
.controller('FollowingCtrl', ['$scope', 'soundcloud', function($scope, soundcloud){
  $scope.isLoading = true;
  soundcloud.getFollowings($scope.viewUser, function(data){
    $scope.$apply(function(){
      $scope.followings = data;
      $scope.isLoading = false;
    });
  });
  $scope.sorts = [
    { json: 'followers_count', human: 'Popularity', reverse: true },
    { json: 'username', human: 'Alphabetical', reverse: false }
  ];
  $scope.sortFollowings = $scope.sorts[0];  
}])
  
.controller('FollowersCtrl', ['$scope', 'soundcloud', function($scope, soundcloud){
  $scope.isLoading = true;
  soundcloud.getFollowers($scope.viewUser, function(data){
    $scope.$apply(function(){
      $scope.followers = data;
      $scope.isLoading = false;
    });
  });
  $scope.sorts = [
    { json: 'followers_count', human: 'Popularity', reverse: true },
    { json: 'username', human: 'Alphabetical', reverse: false }
  ];
  $scope.sortFollowers = $scope.sorts[0];
}])
  
.controller('TracklistCtrl', ['$scope', '$location', 'soundcloud', 'player', function($scope, $location, soundcloud, player) {

  $scope.player = player;
  
  // Stream Pagination
  $scope.showMoreStream = function() {
    $scope.isLoading = true;
    var url = $scope.streamNextPage;
    var params = { limit: $scope.pageSize };
    soundcloud.getStream(url, params, function(data, tracks){
      $scope.$apply(function(){
        if($scope.tracks[$scope.tracks.length-1].id == player.tracks[player.tracks.length-1].id) {
          player.tracks = player.tracks.concat(tracks);
        };
        $scope.tracks = $scope.tracks.concat(tracks);
        $scope.hasPrevPage = false;
        $scope.hasNextPage = false;  
        $scope.isLoading = false;
        $scope.streamNextPage = data.next_href;
      });
    });
    $scope.page = $scope.page + 1;
  };
  
  // New Pagination
  $scope.updatePage = function(){
    $scope.page = ($scope.pageOffset + $scope.pageSize) / $scope.pageSize;
  };

  $scope.getMore = function(){
    if($scope.hasNextPage){
      $scope.isLoading = true;
      $scope.pageOffset = $scope.pageOffset + $scope.pageSize;
      $scope.getParams = { limit: $scope.pageSize, offset: $scope.pageOffset };
      soundcloud.getTracks($scope.getUrl, $scope.getParams, function(data){
        $scope.$apply(function(){
          if(player.tracks){
            if($scope.tracks[$scope.tracks.length-1].id == player.tracks[player.tracks.length-1].id) {
              player.tracks = player.tracks.concat(data);
            };
          };
          $scope.tracks = $scope.tracks.concat(data);
          $scope.hasPrevPage = ($scope.pageOffset >= $scope.pageSize);
          $scope.hasNextPage = ($scope.tracks.length >= $scope.pageSize);
          $scope.isLoading = false;
        });
      });
      $scope.updatePage();
    };
  };

  $scope.loadMore = function(){
    if($scope.isLoading) return false;
    if($scope.currentState == 'home') $scope.showMoreStream();
    else $scope.getMore();
  };
        
}])
  
.controller('TrackCtrl', ['$scope', '$timeout', 'soundcloud', function($scope, $timeout, soundcloud) {

  $scope.dropdownIsOpen = false;
  $scope.toggleDropdown = function() {
    $scope.dropdownIsOpen = ! $scope.dropdownIsOpen;
    $scope.addToPlaylistIsOpen = false;
    $scope.shareIsOpen = false;
  };

  $scope.addToPlaylistIsOpen = false;
  $scope.toggleAddToPlaylist = function() { 
    $scope.addToPlaylistIsOpen = ! $scope.addToPlaylistIsOpen;
  };

  $scope.shareIsOpen = false;
  $scope.toggleShare = function() { $scope.shareIsOpen = !$scope.shareIsOpen; };

  $scope.like = function(track) {        
    if($scope.token){
      soundcloud.like(track, function(data){
        $scope.$apply(function(){
          track.user_favorite = true;
          $timeout(function(){
            $scope.dropdownIsOpen = false;
          }, 1000);
        });           
      });
    } else {
      $scope.connect();
    };
  };
  $scope.unlike = function(track) {
    soundcloud.unlike(track, function(data){
      $scope.$apply(function(){
        track.user_favorite = false;  
        $timeout(function(){
          $scope.dropdownIsOpen = false;
        }, 1000);
      });
    });
  };

  $scope.flashMessage = null;

  $scope.addToPlaylist = function(track, playlist) {
    soundcloud.addToPlaylist(track, playlist, function(data){
      $scope.$apply(function(){
        $scope.flashMessage = 'Added to ' + data.title;
        $scope.addToPlaylistIsOpen = false;
        $timeout(function(){
          $scope.flashMessage = null;
          $scope.dropdownIsOpen = false;  
        }, 3500);
      });
      
    });
  };

  $scope.createPlaylist = function(name, track){
    var tracks = [];
    tracks.push(track.id);
    var tracks = tracks.map(function(id) { return { id: id } });
    var playlist = { playlist: { title: name, tracks: tracks } };
    soundcloud.createPlaylist(playlist, function(data){
      $scope.$apply(function(){
        $scope.flashMessage = 'Added to new playlist ' + data.title;
        $scope.addToPlaylistIsOpen = false;
        $timeout(function(){
          $scope.flashMessage = null;
          $scope.dropdownIsOpen = false;  
        }, 3500);
      });
    });
  };

  $scope.removeIsOpen = false;
  $scope.toggleRemove = function() { $scope.removeIsOpen = !$scope.removeIsOpen; };

  $scope.removeFromPlaylist = function(track, playlist) {
    $scope.isRemoving = track.id;
    soundcloud.removeFromPlaylist(track, playlist, function(data){
      $scope.$apply(function(){
        $scope.set = data;
        $scope.getSet();
        $scope.tracks = [];
        $scope.tracks = data.tracks;
        $scope.removeIsOpen = false;
        $scope.isRemoving = null;
      });
    });
  };

}])

.controller('SearchCtrl', ['$scope', '$location', 'soundcloud', function($scope, $location, soundcloud) {

  $scope.search = function(){
    console.log('search for ' + $scope.searchQuery);
    $scope.isLoading = true;
    $scope.searchResults = null;
    $location.search($scope.searchQuery); 

    $scope.pageOffset = 0;
    var params = { q: $scope.searchQuery };
    soundcloud.search(params, function(data){
      $scope.$apply(function(){
        $scope.searchResults = data.collection;  
        $scope.isLoading = false;
      });
    });
  };

  $scope.searchMore = function(){
    if($scope.isLoading || !$scope.searchResults) return false;
    console.log('search more');
    $scope.isLoading = true;
    $scope.pageOffset = $scope.pageOffset + $scope.pageSize;
    var params = { q: $scope.searchQuery, offset: $scope.pageOffset };
    soundcloud.search(params, function(data) {
      $scope.$apply(function(){
        $scope.searchResults = $scope.searchResults.concat(data.collection);
        $scope.isLoading = false;
      });
    });
  };

}])
  
.controller('QueueCtrl', ['$scope', 'player', function($scope, player) {
    $scope.tracks = player.tracks;
}])
  
// .controller('HistoryCtrl', ['$scope', 'storage', function($scope, storage){
//   $scope.history = storage.get('history');
// }])

;  
