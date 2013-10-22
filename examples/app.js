var app = angular.module('angular-json', ['jsnEditor']);

app.service('model', function() {
  this.shopdata = {
    opening_hours: {},
    categories: {},
    products: {}
  };
  this.activeSection = 'text_editor';
  this.activeCategory = '';
});

app.controller('EditorCtrl', function($rootElement, $scope, model) {
  $scope.model = model;
  $scope.selectSection = function(section) {
    $scope.model.activeSection = section;
  }
});

app.controller('CategoryCtrl', function($scope, model) {
  $scope.model = model;
  
  $scope.getCategoryDefaults = function() {
    return {
      active: true,
    };
  }
  
  $scope.selectCategory = function(categoryName) {
    $scope.model.activeCategory = categoryName;
    $scope.model.activeSection = 'products';
  }
});

app.controller('ProductCtrl', function($scope, model) {
  $scope.model = model;
  
  $scope.getProductDefaults = function() {
    return {
      active: true,
      category: $scope.model.activeCategory || "",
      price: []
    };
  }
  
  $scope.getCategoryNames = function() {
    var noCategory = [""];
    return noCategory.concat(Object.keys($scope.model.shopdata.categories));
  }
});
