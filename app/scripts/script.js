// create the module and name it scotchApp
var scotchApp = angular.module('scotchApp');

class mainController {
  constructor($scope) {
    this.message = 'Everyone come and see how good I look!';

    this.$scope = $scope;
    this.options = {
      width: 2000,
      height: 500,
      nodeWidth: 15,
      nodePadding: 10,
      dynamicLinkColor: true,
      margin: { top: 1, right: 1, bottom: 6, left: 1 }
    };
    this.data = {
      nodes: [
      ],
      links: [
      ]
    };

    this.click = function () {
      this.data = {
      nodes: [
        { 'node': 0, 'name': 'Junior' },
        { 'node': 1, 'name': 'Mid Senior' },
        { 'node': 2, 'name': 'Senior' },
        { 'node': 3, 'name': 'Tech Lead' },
        { 'node': 4, 'name': 'CTO' },
        { 'node': 5, 'name': 'COO' },
        { 'node': 6, 'name': 'CEO' }
      ],
      links: [
        { 'source': 0, 'target': 1, 'value': 1000 },
        { 'source': 0, 'target': 2, 'value': 200 },
        { 'source': 0, 'target': 5, 'value': 10 },
        { 'source': 1, 'target': 2, 'value': 500 },
        { 'source': 1, 'target': 5, 'value': 2 },
        { 'source': 2, 'target': 3, 'value': 200 },
        { 'source': 2, 'target': 5, 'value': 50 },
        { 'source': 3, 'target': 4, 'value': 100 },
        { 'source': 3, 'target': 5, 'value': 125 },
        { 'source': 4, 'target': 6, 'value': 100 },
        { 'source': 5, 'target': 6, 'value': 100 }
      ]
    };
    };
  }
}

// create the controller and inject Angular's $scope
scotchApp.component('mainComponent', {
  templateUrl: 'home.html',
  controller: mainController
});

class aboutController {
  constructor() {
    this.message = 'Look! I am an about page.';

    this.structure = {
      tables: [{
        name: 'Customer',
        fields: [{
          name: 'id',
          type: 'integer'
        }, {
          name: 'name',
          type: 'string'
        }]
      }, {
        name: 'Order',
        fields: [{
          name: 'id',
          type: 'integer'
        }, {
          name: 'custId',
          type: 'integer'
        }]
      }],
      relations: [{
        parent: 'Customer',
        child: 'Order',
        fieldMap: {
          id: 'custId'
        }
      }]
    }
  }
}

scotchApp.component('aboutComponent', {
  templateUrl: 'about.html',
  controller: aboutController
});

class contactController {
  constructor($scope) {
    var ctrl = this;
    this.$scope = $scope;
    this.message = 'Contact us! JK. This is just a demo.';

    this.labels = ['2017-01-01 00:00:00', '2017-01-01 00:00:30',
      '2017-01-01 00:01:00', '2017-01-01 00:01:30',
      '2017-01-01 00:02:00', '2017-01-01 00:02:30', '2017-01-01 01:03:00'];
    this.data = [
      [12, 19, 3, 5, 2, 3, 8]
    ];
    this.seriese = ["chart"];
    this.datasets = [{
      pointBackgroundColor: ["#ffcf00", "#0154a4", "#00ff00", "#000", "#fff", "#fcf001", "#123456"]
    }];
    this.options = {
      scales: {
        xAxes: [{
          type: 'time',
          time: {
            displayFormats: {
              month: 'YYYY-MM-DD hh:mm:ss',
              day: 'YYYY-MM-DD hh:mm:ss',
              hour: 'YYYY-MM-DD hh:mm:ss',
              minute: 'hh:mm:ss',
              second: 'hh:mm:ss'
            }
          }
        }]
      }
    };

    this.onClick = function (points) {
      console.log(points);
      for (var i in points) {
        var d = points[i];
        console.log(d._index);
        ctrl.datasets[0].pointBackgroundColor[d._index] = "#ff0000"
      }

      ctrl.$scope.$apply();
    }
  }
}

scotchApp.component('contactComponent', {
  templateUrl: 'contact.html',
  controller: contactController
});