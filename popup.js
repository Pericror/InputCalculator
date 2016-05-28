/* expected_input = 0 for expecting a number/thing, 1 for expecting an operator*/
var expected_input = 0;

// Handles input info from the content script
function handleInputInfo(inputInfo) {
    console.log(inputInfo);

    var table = document.getElementById('inputMap');
    var inputButtons = document.getElementById('inputButtons');
    var outputTarget = document.getElementById('outputDropdown');
    var sortedInputInfo = Object.keys(inputInfo).sort();
    for( var i = 0; i < sortedInputInfo.length; i++)
    {
        //table start logic
        var row = table.insertRow(table.rows.length);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        cell1.innerHTML = sortedInputInfo[i];
        cell2.innerHTML = inputInfo[sortedInputInfo[i]]['id'];
        cell3.innerHTML = inputInfo[sortedInputInfo[i]]['value'];
        //table end logic
        
        var inputButton = document.createElement('button');
        inputButton.className = 'operation dynamicbtn';
        inputButton.setAttribute('data-value',inputInfo[sortedInputInfo[i]]['value']);
        inputButton.textContent = sortedInputInfo[i] + '\n(' + inputInfo[sortedInputInfo[i]]['value'] + ')'
        if( inputInfo[sortedInputInfo[i]]['value'] != "" )
        {
            inputButton.onclick = operatorClick;
        }
        else // cannot select inputs with no value entered
        {
            inputButton.classList.add('inactive');
        }
        inputButtons.appendChild(inputButton);
        
        var outputOption = document.createElement('option');
        outputOption.textContent = sortedInputInfo[i];
        outputOption.value = inputInfo[sortedInputInfo[i]]['id'];
        outputTarget.appendChild(outputOption);
    }
   
}

/*
TODO:
sanitize the input during calculation, either here or content.js
*/

function calculateInput() {
    console.log("popup.js > calculateInput()");
    var calculate = document.getElementById('inputField').value;
    var result = "";
    try {
        result = eval(calculate);
    }
    catch(err) {
        console.log(err);
    }
    document.getElementById('inputField').value = result;
}

function toggleOutput(toggle) {
    if(toggle)
    {
        document.getElementById('sendOutput').classList.remove('inactive');
        document.getElementById('sendOutput').onclick = sendOutput;        
    }
    else
    {
        document.getElementById('sendOutput').classList.add('inactive');
        document.getElementById('sendOutput').onclick = function(){};
    }
    
}

function sendOutput() {
    var selectedOutput = document.getElementById('outputDropdown').value;
    var output = document.getElementById('inputField').value;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 
                                {from: 'popup', 
                                        subject: 'OutputInfo',
                                        outputId: selectedOutput,
                                        outputValue: output}, 
                                function(response) {
                                    console.log("popup.js response to sendoutput");
                                    console.log("Success: " + response.success.toString());
                                });
    });
}

function operatorClick() {
    var operator = this;
    operator.classList.add('clicked');
    setTimeout(function(){ operator.classList.remove('clicked')}, 200);
    var operatorValue = operator.getAttribute('data-value');
    var inputField = document.getElementById('inputField');
    switch( operatorValue)
    {
        case "=":
            calculateInput();
            toggleOutput(true);
            expected_input = 1;
            break;
        case "(":
            if (expected_input == 0) {
                inputField.value += " " + operatorValue;
                expected_input = 0;
            }
            break;
        case ")":
            if (expected_input == 1) {
                inputField.value += " " + operatorValue;
                expected_input = 1;
            }
            break;
        case "+":
        case "-":
        case "/":
        case "*":
            if(inputField.value != "" && expected_input == 1)
            {
                inputField.value += " " + operatorValue;
                expected_input = 0;
            }
            break;            
        case "DEL":
            var lastOperation = inputField.value.lastIndexOf(" ");
            if(lastOperation > -1)
            {
                inputField.value = inputField.value.substr(0,lastOperation);
                if (expected_input == 0) {
                    expected_input = 1;
                } else {
                    expected_input = 0;
                }
            }
            break;
        case "CLEAR":
            inputField.value = "";
            expected_input = 0;
            break;
        default:
            if(inputField.value[0] != " ")
            {
                inputField.value = ""; //clear user calculated value
                expected_input = 0;
                toggleOutput(false);
            }
            if (expected_input == 0) {
                inputField.value += " " + operatorValue;
                expected_input = 1;
            }
            break;
    }
}

// Setup click handlers
window.onload = function(){
    var operators = document.getElementsByClassName('operation');
    for(var i = 0; i < operators.length; i++) {
        operators[i].onclick = operatorClick;
    }
    toggleOutput(false);
}

// Request input info from the content script when the page has loaded
window.addEventListener('DOMContentLoaded', function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {from: 'popup', subject: 'InputInfo'},
            handleInputInfo);
    });
});