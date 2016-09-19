/*******************************************************************************
*
* Input Calculator Popup JS
* ___________________________
* [2016] Pericror
* All Rights Reserved
* Use of this source code is governed by the license found in the LICENSE file.
*/

// operatorExpected = false for expecting an input value / paren, true for expecting an operator
var operatorExpected = false;
var lastButtonPressed = ""; // the data-value of the last button pressed
var numLeftParen = 0;
var numRightParen = 0;

// Returns true if an element has a given class name
function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

// Toggle whether or not the calculator has input available
function toggleError(toggle) {
    if(toggle)
    {
        document.getElementById('error').style.display = 'block';
        document.getElementById('content').style.display = 'none';
        document.getElementById('footer').style.display = 'none';
    }
    else
    {
        document.getElementById('error').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        document.getElementById('footer').style.display = 'block';
    }
}

// Changes all dynamically generated buttons width
function updateOperationWidth(newValue)
{
    var operations = Array.prototype.slice.call(document.getElementsByClassName("operation")).filter(function(value) {
                                                                           return !value.classList.contains("operator");
                                                                       });
    var operationWidth = parseInt(operations[0].style.width.replace("px",""));
    var newWidth = newValue.length * 12; //width 12px per char
    if( newWidth > operationWidth)
    {
        for( var i = 0; i < operations.length; i++)
        {
            operations[i].style.width = newWidth.toString() + "px";
        }
    }
}

// Handles input info from the content script
function handleInputInfo(inputInfo) {
    var inputButtons = document.getElementById('inputButtons');
    var sortedInputInfo = Object.keys(inputInfo).sort();
    var maxCharLen = 0;

    if(sortedInputInfo.length > 0)
    {
        toggleError(false);

        // Get the character width of the longest input name or value
        for( var j = 0; j < sortedInputInfo.length; j++) {
            var checkMax = Math.max(sortedInputInfo[j].length, inputInfo[sortedInputInfo[j]]['value'].length);
            if (checkMax > maxCharLen) {
                maxCharLen = checkMax;
            }
        }
        maxCharLen *= 12; //width 12px per char

        // Dynamically generate button for every input field
        for(var i = 0; i < sortedInputInfo.length; i++)
        {
            var info = inputInfo[sortedInputInfo[i]];
            var inputButton = document.createElement('button');
            
            inputButton.className = 'operation';
            inputButton.setAttribute('data-value',info['value']);
            inputButton.setAttribute('data-id',info['id']);
            inputButton.setAttribute('data-name',sortedInputInfo[i]);
            inputValue = '(' + info['value'] + ')';
            if( info['value'] === '' )
            {
                inputValue = '(Empty)';
            }
            inputButton.innerHTML = sortedInputInfo[i] + '<br/>' + inputValue;
            inputButton.style.width = maxCharLen.toString() + "px";

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
    else // no numerical input found on current page
    {
        toggleError(true);
    }
}

// Handles the equals operator to calculate the current expression
function calculateInput() {
    var calculate = document.getElementById('inputField').value;
    var result = "";
    var inputValid = true;
    if (numLeftParen == numRightParen) {
        try {
            result = eval(calculate);
            if(result == undefined)
            {
                result = "";
                operatorExpected = false;
                inputValid = false;
            }
        }
        catch(err) {
            console.log(err);
            result = ("Error: Invalid Expression Entered.")
            operatorExpected = false;
            inputValid = false;
        }
    } else {
        result = "Error: Mismatched Parentheses.";
        operatorExpected = false;
        inputValid = false;
    }
    document.getElementById('inputField').value = result;
    return inputValid;
}

// Handles passing the new input value to the content js
// Updates the output operator with the new value and sets it an an active state
function sendOutput(id) {
    var output = document.getElementById('inputField').value;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 
                                {from: 'popup', 
                                        subject: 'OutputInfo',
                                        outputId: id,
                                        outputValue: output}, 
                                function(response) {
                                    if( response.success )
                                    {
                                        var operation = document.querySelectorAll('[data-id="'+id+'"]')[0];
                                        // Update the target input operator button with new value 
                                        if(response.newValue != "")
                                        {
                                                operation.setAttribute('data-state', 'active');                 
                                        }
                                        else
                                        {
                                                operation.setAttribute('data-state', 'inactive');                       
                                        }
                                        updateOperationWidth(response.newValue);                                        
                                        operation.textContent = operation.getAttribute('data-name') + '\n(' + response.newValue + ')';
                                        operation.setAttribute('data-value', response.newValue);
                                    }
                                    restoreActiveStates();
                                });
    });
}

//Restore operation buttons to their original data-state
function restoreActiveStates()
{
    var operations = document.getElementsByClassName('operation');
    for(var i = 0; i < operations.length; i++) {
        if(!hasClass(operations[i], 'operator'))
        {
            operations[i].classList.remove('target');
            if(operations[i].getAttribute('data-state') == 'active')
            {
                operations[i].onclick = operationClick;
                operations[i].classList.remove('inactive');               
            }
            else
            {
                operations[i].onclick = function(){};
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
    switch(operatorValue)
    {
        case '=':
            var inputValid = calculateInput();
            if (inputValid)
            {
                toggleOutput(true);
            }
            operatorExpected = true;
            numLeftParen = 0;
            numRightParen = 0;
            break;
        case '(':
            if (!operatorExpected)
            {
                inputField.value += " " + operatorValue;
                operatorExpected = false;
                numLeftParen++;
            }
            break;
        case ')':
            if (operatorExpected && numLeftParen > numRightParen)
            {
                inputField.value += " " + operatorValue;
                operatorExpected = true;
                numRightParen++;
            }
            break;
        case '+':
        case '-':
        case '/':
        case '*':
            if(inputField.value != "" && operatorExpected)
            {
                inputField.value += " " + operatorValue;
                operatorExpected = false;
            }
            break;            
        case 'DEL':
            var lastOperation = inputField.value.lastIndexOf(" ");
            if(lastOperation > -1)
            {
                inputField.value = inputField.value.substr(0,lastOperation);
                operatorExpected = !operatorExpected; // invariant value and operator alternate
            }
            break;
        case 'CLEAR':
            inputField.value = "";
            operatorExpected = false;
            numLeftParen = 0;
            numRightParen = 0;
            toggleOutput(false);
            break;
        case 'SEND':
            var operations = document.getElementsByClassName('operation');
            for(var i = 0; i < operations.length; i++) {
                if(!hasClass(operations[i], 'operator'))
                {
                    operations[i].classList.add('target');
                    operations[i].classList.remove('inactive');
                    operations[i].onclick = operationClick;
                }
            }
            break;            
        default: // non-operator button
            if(lastButtonPressed == 'SEND')
            {
                sendOutput(operation.getAttribute('data-id'));
            }
            else if(lastButtonPressed == '=')
            {
                inputField.value = ""; // clear user calculated value
                operatorExpected = false;
                toggleOutput(false);
            }

            if (!operatorExpected) {
                inputField.value += " " + operatorValue;
                operatorExpected = true;
            }
            break;
    }
    
    if( lastButtonPressed == 'SEND' )
    {
        lastButtonPressed = '='; // allows sending output to multiple fields
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

// Load page in new tab
function loadPage() {
    chrome.runtime.sendMessage({
        from:    'popup',
        subject: 'showLink'
    });
}

// Setup click handlers
window.onload = function(){
    var operations = document.getElementsByClassName('operation');
    for(var i = 0; i < operations.length; i++) {
        operations[i].onclick = operationClick;
    }
    toggleOutput(false);
    document.getElementsByTagName("a")[0].onclick = loadPage;
}

// Request input info from the content script when the page has loaded
window.addEventListener('DOMContentLoaded', function () {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {from: 'popup', subject: 'InputInfo'},
            handleInputInfo);
    });
});