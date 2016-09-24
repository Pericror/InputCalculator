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

// Return the document object containing the inputs
function getDocument()
{
    if(window.frames["gsft_main"] != undefined)
    {
        var doc = window.frames["gsft_main"].document
    }
    else
    {
        var doc = window.document;
    }
    return doc;
}

// Listen for popup info request or calculation
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.from === 'popup')
    {
        switch(request.subject)
        {
            // Request from popup.js to send input info
            case 'InputInfo':
                var inputInfo = {};
                
                // Pull table name out of URL
                if(window.location.href.indexOf("nav_to.do") > -1)
                {
                    var reTableMatch = window.location.href.match("%2F(.*).do%3F");
                }
                else
                {
                    var reTableMatch = window.location.pathname.match("/(.*).do");
                }
                
                var doc = getDocument();
                
                if(reTableMatch != null)
                {
                    // Get potential supported numerical input fields
                    var tableName = reTableMatch[1];
                    var inputElements = doc.querySelectorAll("input");
                    var inputsArray = Array.prototype.slice.call(inputElements);
                    var supportedInputs = inputsArray.filter(supportedField);

                    // Populate inputInfo with data to build buttons
                    for(var i = 0; i < supportedInputs.length; i++)
                    {
                        if(supportedInputs[i].id.indexOf('.') == -1)
                        {
                            continue; // id does not contain element name
                        }
                        var elementName = supportedInputs[i].id.split(".")[1]
                        var container = doc.getElementById('element.'+tableName+'.'+elementName);
                        if(container == undefined)
                        {
                            continue; // could not find supported element container
                        }
                        var inputName = container.getElementsByClassName('label-text')[0].textContent;
                        var info = {};
                        info['value'] = supportedInputs[i].value.replace(/[^\d.]/g,""); // remove any non numeric non decimal chars                      
                        info['id'] = supportedInputs[i].id;
                        inputInfo[inputName] = info;
                    }
                }
                
                sendResponse(inputInfo);
                break;
            
            // Request from popup.js to update input value
            case 'OutputInfo':
                var doc = getDocument();
                var outputField = doc.getElementById(request.outputId);
                var outType = "";
                try
                {
                    outType = outputField.parentElement.parentElement.childNodes[0].getAttribute('type');
                }
                catch(err){};
                if(outType == "integer")
                {
                        outputField.value = Math.round(parseInt(request.outputValue)).toString(); // round integers
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