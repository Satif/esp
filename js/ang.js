var app = angular.module("app", []);
app.directive('fileChange', function() {
  return {
    restrict: 'A',
    scope: {
      handler: '&'
    },
    link: function (scope, element) {
      element.on('change', function (event) {
        scope.$apply(function() {
          scope.handler({files: Array.prototype.slice.call(event.target.files, 0, 5)});
        });
      });
    }
  };
});
app.controller("appCtrl", function($scope, $timeout) {
  var wsUri = "wss://echo.websocket.org";

  $scope.resultsText = [];

  $timeout(function() {
    init();
  }, 0);

  ////////

  function init() {
    websocket = new WebSocket(wsUri);
    websocket.onopen = function(evt) { onOpen(evt) };
    websocket.onclose = function(evt) { onClose(evt) };
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { onError(evt) };
  }

  function onOpen(evt) {
    $scope.sendTextToView("CONNECTED");
  }

  function onClose(evt) {
    $scope.sendTextToView("DISCONNECTED");
  }

  function onMessage(evt) {
    $scope.sendTextToView(evt.data);
  }

  function onError(evt) {
    $scope.sendTextToView(evt.data);
  }

  $scope.sendSocketManually = function(text) {
    websocket.send(text);
    $scope.inputDirectMessage = '';
  };

  $scope.sendTextToView = function(text) {
    $scope.resultsText.push({
      date: new Date,
      text: text
    });

    if (!$scope.$$phase) {
      $scope.$apply();
    }
  };

  $scope.makeFileList = function(files) {
    $scope.files = files;
  };

  $scope.uploadJsonFiles = function() {
    $scope.uploadedFiles = $scope.files;
    $scope.selectedExperiment = $scope.uploadedFiles[0];
    $scope.selectExperiment();

    clearUploadForm();
  };

  function clearUploadForm() {
    var inputFilesToUpload = document.getElementById('filesToUpload');
    inputFilesToUpload.value = '';
    $scope.files = null;
  }

  // Convert file to json
  $scope.selectExperiment = function() {
    var readFile = new FileReader();
    readFile.onload = function(e) {
      $scope.$apply(function() {
        var contents = e.target.result;
        var json = JSON.parse(contents);
        $scope.dataExperiment = json.Groups;

        websocket.send('$I' + $scope.selectedExperiment.name);
      });
    };

    // If selected item exist - parse json
    if ($scope.selectedExperiment) {
      readFile.readAsText($scope.selectedExperiment);
    }
  };

  $scope.runExperiment = function() {
    console.log('Experiment run');
    websocket.send('$s');
  };

  $scope.stopExperiment = function() {
    console.log('Experiment stop');
    websocket.send('$cx');
  };

  $scope.removeExperiment = function() {
    console.log('Experiment remove');

    var ind = $scope.uploadedFiles.indexOf($scope.selectedExperiment);
    $scope.uploadedFiles.splice(ind, 1);

    // Select first item after delete
    if ($scope.uploadedFiles && $scope.uploadedFiles.length) {
      $scope.selectedExperiment = $scope.uploadedFiles[0];
    } else {
      $scope.dataExperiment = null;
      $scope.uploadedFiles = null;
    }

    websocket.send('d' + $scope.selectedExperiment.name);
  };
});