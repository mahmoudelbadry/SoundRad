'text use strict';

var soundrad = angular.module('soundrad', ['soundrad.services', 'soundrad.controllers', 'ngTouch', 'ui.router', 'ui.sortable', 'infinite-scroll']).
  config(['$stateProvider', '$locationProvider', function($stateProvider, $locationProvider) {

    $stateProvider.state('home', { url: '/', templateUrl: '/partials/home.html' });
    $stateProvider.state('callback', { url: '/callback', templateUrl: '/partials/callback.html' });
    $stateProvider.state('settings', { url: '/settings', templateUrl: '/partials/settings.html' });
    $stateProvider.state('about', { url: '/about', templateUrl: '/partials/about.html' });
    $stateProvider.state('playing', { url: '/playing', templateUrl: '/partials/playing.html' });

    $stateProvider.state('search', { url: '/search', templateUrl: '/partials/search.html', controller: 'SearchCtrl' });

    $stateProvider.state('history', { url: '/history', templateUrl: '/partials/history.html', controller: 'HistoryCtrl' });
    
    $stateProvider.state('user', { url: '/:user', templateUrl: '/partials/user.html', controller: 'UserCtrl' });
        $stateProvider.state('user.likes', { url: '/likes', templateUrl: '/partials/user.likes.html', controller: 'LikesCtrl' });
        $stateProvider.state('user.sets', { url: '/sets', templateUrl: '/partials/user.sets.html', controller: 'SetsCtrl' });
            $stateProvider.state('user.set', { url: '/sets/:set', templateUrl: '/partials/user.sets.set.html', controller: 'SetDetailCtrl' });    
        $stateProvider.state('user.info', { url: '/info', templateUrl: '/partials/user.info.html', controller: 'InfoCtrl' });
        $stateProvider.state('user.track', { url: '/:track', templateUrl: '/partials/user.track.html', controller: 'TrackDetailCtrl' });
        // $stateProvider.state('user.following', { url: '/following', templateUrl: '/partials/user.following.html', controller: 'FollowingCtrl' });
        // $stateProvider.state('user.followers', { url: '/followers', templateUrl: '/partials/user.followers.html', controller: 'FollowersCtrl' });

    $locationProvider.html5Mode(true);
  }]);
