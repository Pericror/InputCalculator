/* expected_input = 0 for expecting a number/thing, 1 for expecting an operator*/
var expected_input = 0;
var numLeftParen = 0;
var numRightParen = 0;
var inputValid = true;

// Handles input info from the content script
function handleInputInfo(inputInfo) {
    console.log(inputInfo);

    var table = document.getElementById('inputMap');
    var inputButtons = document.getElementById('inputButtons');
    var outputTarget = document.getElementById('outputDropdown');
    var sortedInputInfo = Object.keys(inputInfo).sort();
    var longestCharNum = 0;
    for( var j = 0; j < sortedInputInfo.length; j++) {
        var maxkeyval = Math.max(sortedInputInfo[j].length, inputInfo[sortedInputInfo[j]]['value'].length);
        if (maxkeyval > longestCharNum) {
            longestCharNum = maxkeyval;
        }
    }
    console.log(longestCharNum);

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
        inputButton.className = 'operation';
        inputButton.style.color = 'red';
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
    inputValid = true;
    if (numLeftParen == numRightParen) {
        try {
            result = eval(calculate);
        }
        catch(err) {
            console.log(err);
            expected_input = 0;
            inputValid = false;
        }
    } else {
        result = "Mismatched Parentheses Error";
        expected_input = 0;
        inputValid = false;
    }
    numLeftParen = 0;
    numRightParen = 0;
    if (inputValid) {
        result = " " + result ;
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
            expected_input = 1;
            calculateInput();
            toggleOutput(true);
            break;
        case "(":
            if (expected_input == 0) {
                inputField.value += " " + operatorValue;
                expected_input = 0;
                numLeftParen++;
            }
            break;
        case ")":
            if (expected_input == 1) {
                inputField.value += " " + operatorValue;
                expected_input = 1;
                numRightParen++;
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
            if (inputValid) {
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
            }
            break;
        case "CLEAR":
            inputField.value = "";
            inputValid = true;
            expected_input = 0;
            numLeftParen = 0;
            numRightParen = 0;
            break;
        default:
            if(inputField.value[0] != " ")
            {
                inputField.value = ""; //clear user calculated value
                inputValid = true;
                expected_input = 0;
                toggleOutput(false);
                //console.log("clear for some reason");
            }
            if (expected_input == 0) {
                //console.log("clicked a number");
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