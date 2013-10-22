var jsnEditor = angular.module('jsnEditor', []);

/**
 * jsn-editable can be used to make any value editable on click
 * depending on given jsn-type the value will be parsed before saving
 * supported jsn-types:
 *  - text (will be parsed as string but comes with a textarea)
 *  - string
 *  - integer
 *  - float
 *  - boolean (will be toggled on click)
 *  - propertyname (a jsn-collection must be given additionaly to edit a object or array key)
 *  - select (a jsn-options function has to be given additionally to fill the options for the select)
 */
jsnEditor.directive('jsnEditable', function (jsnHelper) {
  return {
    restrict: 'A',
    replace: false,
    scope: {
        value: "=jsnEditable",
        type: "@jsnType",
        options: "&jsnOptions",
        collection: "=jsnCollection"
    },
    
    // returning template for given jsn-type attribute. requires angular 1.1.4
    template: function($element, $attrs) {
      var type = $attrs.jsnType;
      var emptyValueTemplate = '<button ng-show="(isValueEmpty() || isValueUndefined()) && !view.editorEnabled" ng-click="create()" ng-focus="create()" ng-class="{\'jsnAdd\': true, \'jsnEmpty\': isValueEmpty()}">+</button>';
      var valueTemplate = '<span ng-hide="view.editorEnabled || isValueEmpty() || isValueUndefined()" ng-click="edit()" ng-focus="edit()" ng-bind="value" tabindex="0" class="jsnValue" title="{{type}}"></span>';
      var template = '';
      
      // boolean elements get toggled on click
      if(type === 'boolean'){
        template = '<span ng-show="!isValueEmpty() && !isValueUndefined()" ng-click="toggle()" ng-bind="value" class="jsnValue" title="{{type}}" />'; 
      }
      
      else if(type === 'select') {
        template = valueTemplate +
          '<select ng-show="view.editorEnabled" ng-model="view.editableValue" ng-options="option for option in options()" ng-blur="cancel()" ng-change="save()"></select>';
      }
      
      // form with textarea with save an cancel buttons
      else if(type === 'text') {
        template = valueTemplate +
          '<form ng-submit="save()" ng-show="view.editorEnabled">' +
          '<textarea ng-model="view.editableValue" ng-blur="save()"></textarea>' +
          '<br />' +
          '<button type="submit" ng-class="\'jsnAdd\'">&#10004</button>' +
          '<button ng-click="cancel()" ng-class="\'jsnCancel\'">&#10008</button>' +
          '</form>';
      }
       
      // form with input element for string, integer and float
      else {
        template = valueTemplate +
          '<form ng-submit="save()" ng-show="view.editorEnabled">' +
          '<input ng-model="view.editableValue" ng-blur="save()"></input>' +
          '</form>';
      }
      
      return emptyValueTemplate + template;
    },
    
    link: function postLink(scope, element, attrs) {
      // set focus on input elmenet when user clicks on element
      scope.$watch('view.editorEnabled', function(enabled) {
        if(enabled) {
          var textbox = element.find('input')[0] || element.find('textarea')[0] || element.find('select')[0];
          if(textbox) {
            textbox.focus();
          }
        }
      });
      
      // cancel edit when user press esc
      element.bind('keyup', function(evt) {
        if(evt.which === 27) { // 27 = ESC
          scope.$apply(scope.cancel());
        }
      });
    },
    
    controller: function($scope, $timeout) {
      // init editable state
      $scope.view = {
        editorEnabled: false,
        editableValue: $scope.value
      }
      
      // init value
      $scope.create = function() {
        $scope.value = jsnHelper.parse($scope.view.editableValue, $scope.type);
        $scope.edit();
      }
      
      // enable edit-mode 
      $scope.edit = function() {
        $scope.view.editorEnabled = true;
      }
      
      // save changes and disable edit-mode. values get parsed based on given type
      $scope.save = function() {
        var newValue = jsnHelper.parse($scope.view.editableValue, $scope.type);
        if(newValue !== $scope.value) {
          // if the value to change is a propertyname (or array key), copy the old property to the new propertyname/key and delete the old one
          if($scope.type === 'propertyname' && $scope.collection) {
            $scope.collection[newValue] = $scope.collection[$scope.value];
            jsnHelper.remove($scope.value, $scope.collection);
          } else {
            $scope.value = newValue;
          }
        }
        $scope.view.editorEnabled = false;
      }
      
      // disable edit-mode and discard changes
      $scope.cancel = function() {
        $scope.view.editableValue = $scope.value;
        $scope.view.editorEnabled = false;
      }

      $scope.isValueEmpty = function() {
        var isEmpty = $scope.value === '' || $scope.value === null;
        return isEmpty;
      }
      
      $scope.isValueUndefined = function() {
        var isUndefined = typeof $scope.value === 'undefined';
        return isUndefined;
      }
      
      // action used for toggeling boolean values
      $scope.toggle = function() {
        $scope.value = jsnHelper.parse(!$scope.value, $scope.type); 
      }
    }
  };
});

/**
 * jsn-addable can be applied on objects and arrays
 */
jsnEditor.directive('jsnAddable', function(jsnHelper) {
  return {
    restrict: 'A',
    replace: false,
    scope: {
      value: "=jsnAddable",
      collectionType: "@jsnCollectionType",
      type: "@jsnType",
      defaults: "&jsnDefaults",
      placeholder: "@jsnPlaceholder"
    },
    template: function($element, $attrs) {
      var type = $attrs.jsnType;
      var collectionType = $attrs.jsnCollectionType;
      var template = '';
      
      // if the type to be added and the collections type are 'array' don't show any input-elements
      if(collectionType === 'array' && type === 'array') {
        template = '<button ng-click="add()" ng-class="{\'jsnAdd\': true, \'jsnAddable\': true}" title="hinzufügen">{{(placeholder || "+")}}</button>';
      }
      else {
        template = '<form ng-submit="add()">' +
        '<input type="text" placeholder="{{placeholder}}" ng-model="view.input" />' +
        '<button type="submit" ng-class="{\'jsnAdd\': true, \'jsnAddable\': true}" title="hinzufügen">+</button>' +
        '</form>';
      }
      return template;
    },
    controller: function($scope) {
      $scope.view = {};
      $scope.add = function() {
        var input = $scope.view.input || "";
        if($scope.collectionType === "array") {
          $scope.value = $scope.value || [];
          if($scope.value.indexOf(input) === -1) {
            $scope.value.push(jsnHelper.parse(input, $scope.type));
            $scope.view.input = ""; // delete input field if value is added
          } else {
            console.log("error: value '" + input + "' can't be added to array");
          }
        }
        else if($scope.collectionType === "object") {
          $scope.value = $scope.value || {};
          if(input && !$scope.value.hasOwnProperty(input)) {
            var value = jsnHelper.parse($scope.defaults(), $scope.type);
            $scope.value[input] = value; // set default values and dispatch two-way-bindig for default-values
            $scope.view.input = ""; // delete input field if value is added
            //$scope.value[input].name = input;
          } else {
            console.log("error: property '" + input + "' can't be added to object");
          }
        }
        else {
          console.log("error: jsn-addable can only be used with jsn-collection-type 'object' or 'array'");
        }
      }
    }
  }
});


/**
 * jsn-removeable can be applied on objects and arrays
 */
jsnEditor.directive('jsnRemoveable', function(jsnHelper) {
  return {
    restrict: 'A',
    replace: false,
    scope: {
      key: "=jsnRemoveable",
      collection: "=jsnCollection"
    },
    template: '<button ng-click="remove()" class="jsnRemove">x</button>',
    controller: function($scope) {
      $scope.view = {};
      $scope.remove = function() {
        jsnHelper.remove($scope.key, $scope.collection);
      }
    }
  }
});

/**
 * Textarea that reflrects the current state of the Model (two-way-binding)
 */
jsnEditor.directive('jsnTextEditor', function() {
  return {
    restrict: 'A',
    replace: false,
    scope: {
      model: "=jsnTextEditor"
    },
    template: '<p>Status:<span ng-bind="view.jsnStatusMsg" ng-class="{\'jsnValid\': view.isValid, \'jsnInvalid\': !view.isValid}"></span></p>' +
      '<textarea rows="10" cols="50" type="textarea" ng-model="view.jsnText" ng-change="jsnChanged()" ng-class="\'jsnTextEditor\'"></textarea>',
    controller: function($scope, model) {
      $scope.view = {
        jsnText: {},
        jsnStatusMsg: 'Valid',
        isValid: true
      };
      $scope.jsnChanged = function() {
        try {
          $scope.model = angular.fromJson($scope.view.jsnText);
          $scope.view.isValid = true;
          $scope.view.jsnStatusMsg = "Valid";
        }
        catch(e) {
          $scope.view.isValid = false;
          $scope.view.jsnStatusMsg = e;
        }
      }
      $scope.$watch('model', function() {
        $scope.view.jsnText = angular.toJson($scope.model, true);
      },true);
    }
  }
});

jsnEditor.filter('objectFilter', function() {
  return function(input, filter) {
    var out = {};
    // iterate over all constraints given by the filter
    angular.forEach(filter, function(filterValue, filterKey) {
      // iterate over all properties of the object to filter
      angular.forEach(input, function(value, key) {
        // check if current filter key-value-pair is matching the current objectitem
        if (value[filterKey] && value[filterKey] === filterValue) {
          out[key] = value;
        }
        // if no value for a filterKey is given, add it anyway
        if (!filterValue) {
          out[key] = value;
        }
      });
    });
    return out;
  };
});

/**
 * some Helper for handling JSON
 */
jsnEditor.service('jsnHelper', function() {
  
  // converts any value to the given type
  this.parse = function(value, type) {
    if(type === 'integer') {
      value = parseInt(value) || null;
    }
    else if(type === 'float') { 
      value = parseFloat(value) || null;
    }
    else if(type === 'boolean') { 
      value = (value === 'true' || value === true);
    }
    else if(type === 'object') {
      if(!value) {
        value = {};
      } else {
        value = angular.fromJson(angular.toJson(value)); // detatch two-way-binding from object
      }
    }
    else if(type === 'array') {
      if(!value) {
        value = []
      } else if (value instanceof Array) {
        // do nothing
      } else {
        value = angular.fromJson('[' + value + ']');
      }
    }
    else { // type === 'string' || type === 'text' || type === 'propertyname'
      if(typeof value === 'undefined' || value === null) {
        value = '';
      }
      value = value + ''; // convert every value to a sting
    }
    return value;
  }
  
  // removes a given key from an array or object
  this.remove = function(key, collection) {
    if(collection instanceof Array) {
      if(collection.length >= key) {
        collection.splice(key, 1);
      } else {
        console.log("array has no key '" + key + "'");
      }
    }
    else if(collection instanceof Object) {
      if(key) {
        delete collection[key];
      } else {
        console.log("object has no property '" + key + "'");
      }
    }
    else {
      // error: jsn-addable can only be used on objects and arrays
    }
  }
});