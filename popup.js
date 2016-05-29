/* operatorExpected = false for expecting an input value / paren, true for expecting an operator*/
var operatorExpected = false;
var lastButtonPressed = ""; // The data-value of the last button pressed

function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

// Handles input info from the content script
function handleInputInfo(inputInfo) {
    console.log(inputInfo);

    var table = document.getElementById('inputMap');
    var inputButtons = document.getElementById('inputButtons');
    var sortedInputInfo = Object.keys(inputInfo).sort();
    for( var i = 0; i < sortedInputInfo.length; i++)
    {
        var info = inputInfo[sortedInputInfo[i]];
        
        //table start logic
        var row = table.insertRow(table.rows.length);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        cell1.innerHTML = sortedInputInfo[i];
        cell2.innerHTML = info['id'];
        cell3.innerHTML = info['value'];
        //table end logic
        
        var inputButton = document.createElement('button');
        inputButton.className = 'operation';
        inputButton.setAttribute('data-value',info['value']);
        inputButton.setAttribute('data-id',info['id']);
        inputButton.setAttribute('data-name',sortedInputInfo[i]);
        inputButton.textContent = sortedInputInfo[i] + '\n(' + info['value'] + ')'
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

function calculateInput() {
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

function sendOutput(id) {
    var output = document.getElementById('inputField').value;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 
                                {from: 'popup', 
                                        subject: 'OutputInfo',
                                        outputId: id,
                                        outputValue: output}, 
                                function(response) {
                                    console.log("popup.js response to sendoutput");
                                    console.log("Success: " + response.success.toString());
                                });
    });
}

function handleSend(operation)
{
    sendOutput(operation.getAttribute('data-id'));
    //Update button
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

function operationClick() {
    var operation = this;
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
            break;
        case "(":
            if (!operatorExpected) {
                inputField.value += " " + operatorValue;
            }
            break;
        case ")":
            if (operatorExpected) {
                inputField.value += " " + operatorValue;
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
            var lastOperation = inputField.value.lastIndexOf(" ");
            if(lastOperation > -1)
            {
                inputField.value = inputField.value.substr(0,lastOperation);
                operatorExpected = !operatorExpected; // invariant value and operator alternate
            }
            break;
        case "CLEAR":
            inputField.value = "";
            operatorExpected = false;
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