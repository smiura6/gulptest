// create the module and name it scotchApp
var scotchApp = angular.module('scotchApp', ['ui.router', 'chart.js','angular-joint-erd', 'ngSankey']);

// configure our routes
scotchApp.config(['$stateProvider', '$locationProvider', '$urlRouterProvider', function ($stateProvider, $locationProvider, $urlRouterProvider) {
	$stateProvider
		// route for the home page
		.state('home', {
			url: '/home',
			template: '<main-component></main-component>'
		})

		// route for the about page
		.state('about', {
			url: '/about',
			template: '<about-component></about-component>'
		})

		// route for the contact page
		.state('contact', {
			url: '/contact',
			template: '<contact-component></contact-component>'
		});

	// configure html5 to get links working on jsfiddle
	$locationProvider.hashPrefix('');
  $urlRouterProvider.otherwise("/home");
  // this.$inject = ['$stateProvider', '$locationProvider', '$urlRouterProvider'];s
}]);

scotchApp.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}]);

angular.bootstrap(document.body, ['scotchApp']);