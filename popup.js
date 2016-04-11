// Handles input info from the content script
function handleInputInfo(inputInfo) {
    console.log(inputInfo);

    table = document.getElementById('inputMap');

    var sortedInputInfo = Object.keys(inputInfo).sort();
    for( var i = 0; i < sortedInputInfo.length; i++)
    {
        var row = table.insertRow(table.rows.length);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        cell1.innerHTML = sortedInputInfo[i];
        cell2.innerHTML = inputInfo[sortedInputInfo[i]]['id'];
        cell3.innerHTML = inputInfo[sortedInputInfo[i]]['value'];
    }
}

// Send the content script the input calculation
function calculateInput() {
    console.log("popup.js > calculateInput()");

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {from: 'popup', subject: 'CalculateInput', data: 'tbd'}, function(response) {
            console.log("popup.js response");
            console.log("Success: " + response.success.toString());
        });
    });

}

window.onload = function(){
	document.getElementById("calculate").onclick = calculateInput;
}

// Request input info from the content script when the page has loaded
window.addEventListener('DOMContentLoaded', function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {from: 'popup', subject: 'InputInfo'},
            handleInputInfo);
    });
});