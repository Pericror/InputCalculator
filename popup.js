/*******************************************************************************
*
* Input Calculator Popup JS
* ___________________________
* [2016] Pericror
* All Rights Reserved
* Use of this source code is governed by the license found in the LICENSE file.
*/

/* operatorExpected = false for expecting an input value / paren, true for expecting an operator */
var operatorExpected = false;
var lastButtonPressed = ""; // the data-value of the last button pressed
var numLeftParen = 0;
var numRightParen = 0;
var inputValid = true;

// Returns true if an element has a given class name
function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

// Handles input info from the content script
function handleInputInfo(inputInfo) {

    var inputButtons = document.getElementById('inputButtons');
    var sortedInputInfo = Object.keys(inputInfo).sort();
    var maxCharLen = 0;
    
    // Get the character width of the longest input name or value
    for( var j = 0; j < sortedInputInfo.length; j++) {
        var checkMax = Math.max(sortedInputInfo[j].length, inputInfo[sortedInputInfo[j]]['value'].length);
        if (checkMax > maxCharLen) {
            maxCharLen = checkMax;
        }
    }

    // Dynamically generate button for every input field
    for( var i = 0; i < sortedInputInfo.length; i++)
    {
        var info = inputInfo[sortedInputInfo[i]];
        var inputButton = document.createElement('button');
        
        inputButton.className = 'operation';
        inputButton.setAttribute('data-value',info['value']);
        inputButton.setAttribute('data-id',info['id']);
        inputButton.setAttribute('data-name',sortedInputInfo[i]);
        inputButton.textContent = sortedInputInfo[i] + '\n(' + info['value'] + ')';
        inputButton.style.width = maxCharLen.toString() + "em";

        if( inputInfo[sortedInputInfo[i]]['value'] != "" )
        {
            inputButton.onclick = operationClick;
            inputButton.setAttribute('data-state', 'active');
        }
        else // cannot select inputs with no value entered
        {
            inputButton.classList.add('inactive');
            inputButton.setAttribute('data-state', 'inactive');
        }
        inputButtons.appendChild(inputButton);
    }
   
}

// Handles the equals operator to calculate the current expression
function calculateInput() {
    var calculate = document.getElementById('inputField').value;
    var result = "";
    inputValid = true;
    if (numLeftParen == numRightParen) {
        try {
            result = eval(calculate);
        }
        catch(err) {
            console.log(err);
            operatorExpected = false;
            inputValid = false;
        }
    } else {
        result = "Mismatched Parentheses Error";
        operatorExpected = false;
        inputValid = false;
    }
    document.getElementById('inputField').value = result;
}

// Handles passing the new input value to the content js
function sendOutput(id) {
    var output = document.getElementById('inputField').value;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 
                                {from: 'popup', 
                                        subject: 'OutputInfo',
                                        outputId: id,
                                        outputValue: output}, 
                                function(response) {
                                });
    });
}

// Handles the save operator to send the new input value to a target input
function handleSend(operation)
{
    sendOutput(operation.getAttribute('data-id'));
    
    //Update the target input operator button with new value 
    var newValue = document.getElementById('inputField').value;
    if(newValue != "")
    {
            operation.setAttribute('data-state', 'active');                 
    }
    else
    {
            operation.setAttribute('data-state', 'inactive');                       
    }
    operation.textContent = operation.getAttribute('data-name') + '\n(' + newValue + ')';
    operation.setAttribute('data-value', newValue);
    
    //Restore operation buttons to previous state
    var operations = document.getElementsByClassName('operation');
    for(var i = 0; i < operations.length; i++) {
        if(!hasClass(operations[i], 'operator'))
        {
            operations[i].classList.remove('target');
            if(operations[i].getAttribute('data-state') == 'active')
            {
                operations[i].onclick = operationClick;
            }
            else
            {
                operations[i].onclick = function(){};
                operations[i].classList.remove('active');
                operations[i].classList.add('inactive');
            }
        }
    }
}

// Handles all calculator button operation clicks
function operationClick() {
    var operation = this; // references button element clicked
    
    // Create button press effect
    operation.classList.add('clicked');
    setTimeout(function(){ operation.classList.remove('clicked')}, 200);
    
    var operatorValue = operation.getAttribute('data-value');
    var inputField = document.getElementById('inputField');
    switch( operatorValue)
    {
        case "=":
            calculateInput();
            toggleOutput(true);
            operatorExpected = true;
            numLeftParen = 0;
            numRightParen = 0;
            break;
        case "(":
            if (!operatorExpected) {
                inputField.value += " " + operatorValue;
                operatorExpected = false;
                numLeftParen++;
            }
            break;
        case ")":
            if (operatorExpected) {
                inputField.value += " " + operatorValue;
                operatorExpected = true;
                numRightParen++;
            }
            break;
        case "+":
        case "-":
        case "/":
        case "*":
            if(inputField.value != "" && operatorExpected)
            {
                inputField.value += " " + operatorValue;
                operatorExpected = false;
            }
            break;            
        case "DEL":
            if (inputValid) {
                var lastOperation = inputField.value.lastIndexOf(" ");
                if(lastOperation > -1)
                {
                    inputField.value = inputField.value.substr(0,lastOperation);
                    operatorExpected = !operatorExpected; // invariant value and operator alternate
                }
            }
            break;
        case "CLEAR":
            inputField.value = "";
            operatorExpected = false;
            inputValid = true;
            numLeftParen = 0;
            numRightParen = 0;
            break;
        case "SEND":
            var operations = document.getElementsByClassName('operation');
            for(var i = 0; i < operations.length; i++) {
                if(!hasClass(operations[i], 'operator'))
                {
                    operations[i].classList.add('target');
                    operations[i].classList.remove('inactive');
                    operations[i].classList.add('active');
                    operations[i].onclick = operationClick;
                }
            }
            break;            
        default: // non-operator button
            if(lastButtonPressed == "SEND")
            {
                handleSend(operation);
            }
            else if(lastButtonPressed == "=")
            {
                inputField.value = ""; //clear user calculated value
                operatorExpected = false;
                inputValid = true;
                toggleOutput(false);
            }

            if (!operatorExpected) {
                inputField.value += " " + operatorValue;
                operatorExpected = true;
            }
            break;
    }
    
    if( lastButtonPressed == "SEND" )
    {
        lastButtonPressed = "=";
    }
    else
    {
        lastButtonPressed = operatorValue;
    }
}

// Toggle whether or not the save button is enabled
function toggleOutput(toggle) {
    if(toggle)
    {
        document.getElementById('sendOutput').classList.remove('inactive');
        document.getElementById('sendOutput').onclick = operationClick;        
    }
    else
    {
        document.getElementById('sendOutput').classList.add('inactive');
        document.getElementById('sendOutput').onclick = function(){};
    }
    
}

// Setup click handlers
window.onload = function(){
    var operations = document.getElementsByClassName('operation');
    for(var i = 0; i < operations.length; i++) {
        operations[i].onclick = operationClick;
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