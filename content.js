/*******************************************************************************
*
* Input Calculator Content JS
* ___________________________
* [2016] Pericror
* All Rights Reserved
* Use of this source code is governed by the license found in the LICENSE file.
*/
/*
// Tell the background page to show the page action, supported urls defined in manifest file
chrome.runtime.sendMessage({
    from:    'content',
    subject: 'showPageAction'
});*/

// Determines if an input field is supported
function supportedField(elem){
    var supported = false;
    // Check for currency/price fields
    if(elem.className.indexOf('decimal') > -1)
    {
        supported = true;
    }
    // Only check non hidden numeric fields
    else if(elem.style.display != 'none' && elem.type != 'hidden')
    {
        try
        {
            var elemType = elem.parentElement.parentElement.childNodes[0].getAttribute('type');
            switch(elemType)
            {
                case 'integer':
                case 'decimal':
                case 'float':
                case 'longint':
                    supported = true;
                    break;
                default:
                    break;
            }
        }
        catch(err){} // grandparent element (hidden type field) did not exist
    }
    return supported;
}

// Listen for popup info request or calculation
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.from === 'popup')
    {
        switch(request.subject)
        {
            // Request from popup.js to send input info
            case 'InputInfo':
                var doc = window.frames["gsft_main"].document;

                var inputElements = doc.querySelectorAll("input");
                var inputsArray = Array.prototype.slice.call(inputElements);
                var supportedInputs = inputsArray.filter(supportedField);

                var inputInfo = {};
                for(var j = 0; j < supportedInputs.length; j++)
                {
                    var incidentName = supportedInputs[j].id.split(".")[1]
                    var container = doc.getElementById('element.incident.'+incidentName);
                    var inputName = container.getElementsByClassName('label-text')[0].textContent;
                    var info = {};
                    info['value'] = supportedInputs[j].value.replace(",",""); // remove any ',' chars                        
                    info['id'] = supportedInputs[j].id;
                    inputInfo[inputName] = info;
                }
                
                sendResponse(inputInfo);
                break;
            
            // Request from popup.js to update input value
            case 'OutputInfo':
                var doc = window.frames['gsft_main'].document;
                var outputField = doc.getElementById(request.outputId);
                var outType = "";
                try
                {
                    outType = outputField.parentElement.parentElement.childNodes[0].getAttribute('type');
                }
                catch(err){};
                if(outType == "integer")
                {
                        outputField.value = request.outputValue.split(".")[0]; // round integers
                }
                else
                {
                        outputField.value = request.outputValue;
                }
                sendResponse({success: true, newValue: outputField.value});
                break;
 
            default:
                console.log("Received unhandled request subject: "+request.subject);
                sendResponse({success: false});
        }
    }
});