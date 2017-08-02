var inputDirectField = document.getElementById('inputDirectField');
var receiveText = document.getElementById('receiveText');
var selectExp = document.getElementById('selectExp');
var resultTable = document.getElementById('resultTable');

var demoData = {
  data: '{"case": 2, "data": "test", "files": ["test.json", "another.json"], "groups":[{"name":"DrugAddition, WT, 24hrs","start_time":1125,"duration":75,"irradiance":6,"cycles":1,"offtime":0,"Channels":[1,2,3,4,5,6]},{"name":"noDrugAddition, WT, 24hrs","start_time":0,"duration":0,"irradiance":0,"cycles":2,"offtime":10,"Channels":[7,8,9,10,11,12]},{"name":"DrugAddition, WT, 24hrs","start_time":0,"duration":1200,"irradiance":6,"cycles":1,"offtime":0,"Channels":[93,94,95,96]}]}'
};

function isJSON(data) {
  var ret = true;
  try {
    JSON.parse(data);
  }catch(e) {
    ret = false;
  }
  return ret;
}

function init() {
  var wsUri = 'wss://echo.websocket.org';
  websocket = new WebSocket(wsUri);
  websocket.onopen = function(evt) { onOpen(evt); };
  websocket.onclose = function(evt) { onClose(evt); };
  websocket.onmessage = function(evt) { onMessage(evt); };
  websocket.onerror = function(evt) { onError(evt); };
}

function onMessage(evt) {
  console.log(evt)
  var obj = isJSON(evt.data) ? JSON.parse(evt.data) : evt.data;

  if (obj && !obj.case) {
    insertMessage(obj);
    return;
  }

  switch(obj.case) {
    case 0:
      // Insert text
      insertMessage(obj.data);

      break;
    case 1:
      // Clear all options
      clearUploadedList();

      // Insert options in dropdown
      for (var i = 0; i < obj.files.length; i++) {
        selectExp.options[selectExp.options.length] = new Option(obj.files[i], obj.files[i]);
      }

      break;
    case 2:
      clearTableRows();

      //Add the data rows.
      for (var j = 0; j < obj.groups.length; j++) {
        row = resultTable.tBodies[0].insertRow(-1);

        var cell1 = row.insertCell(0);
        cell1.innerHTML = obj.groups[j].name;

        var cell2 = row.insertCell(1);
        cell2.innerHTML = obj.groups[j].Channels.join();

        var cell3 = row.insertCell(2);
        cell3.innerHTML = obj.groups[j].irradiance;

        var cell4 = row.insertCell(3);
        cell4.innerHTML = obj.groups[j].duration;

        var cell5 = row.insertCell(4);
        cell5.innerHTML = obj.groups[j].start_time;

        var cell6 = row.insertCell(5);
        cell6.innerHTML = obj.groups[j].cycles;

        var cell7 = row.insertCell(6);
        cell7.innerHTML = obj.groups[j].offtime;
      }
      
      break;
  }
}

function clearTableRows() {
  var rowCount = resultTable.rows.length;
  for (var x=rowCount-1; x>0; x--) {
    resultTable.deleteRow(x);
  }
}

function clearUploadedList(ind) {
  // Remove one option
  console.log(ind)
  if (ind) {
    selectExp.removeChild(selectExp[ind]);
  } else {
    // Remove all options
    while (selectExp.options.length > 0) {
      selectExp.remove(0);
    }
  }
}

function sendSocketManually(e) {
  e.preventDefault();

  var val = inputDirectField.value;
  if (!val || !val.length) return;

  websocket.send(val);
  inputDirectField.value = '';
}

function onOpen() {
  websocket.send('CONNECTED');
}

function onClose() {
  websocket.send("CLOSED");
}

function onError(evt) {
  var obj = JSON.parse(evt.error);
  websocket.send(obj.data);
}

function insertMessage(text) {
  var div = document.createElement("div");
  div.classList.add('column');
  div.innerHTML = text;
  receiveText.insertBefore(div, receiveText.firstChild);
}

function runExperiment() {
  websocket.send('$s');
}

function stopExperiment() {
  websocket.send('$cx');
}

function removeExperiment() {
  var selectedOption = selectExp.options && selectExp.options.length ? selectExp.options[selectExp.selectedIndex].value : null;

  if (selectedOption) {
    clearUploadedList(selectExp.selectedIndex);
    websocket.send('d' + selectedOption);
  }
}