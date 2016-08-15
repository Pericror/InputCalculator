/*******************************************************************************
*
* Input Calculator Content JS
* ___________________________
* [2016] Pericror
* All Rights Reserved
* Use of this source code is governed by the license found in the LICENSE file.
*/

// Tell the background page to show the page action
chrome.runtime.sendMessage({
    from:    'content',
    subject: 'showPageAction'
});

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
                var validInputs = inputsArray.filter(function(x){
                                                        return (x.className.indexOf('integer') != -1 
                                                            || x.className.indexOf('decimal') !=-1);
                                                    });
                var dateTimeInputs = inputsArray.filter(function(x) {
                                                        return x.dataset.type != undefined &&
                                                            x.dataset.type.indexOf('date') > -1;
                                                    });
                if(dateTimeInputs.length != 0)
                {
                    if(dateTimeInputs[dateTimeInputs.length - 1].id.indexOf('closed_at') > -1)
                    {
                        dateTimeInputs.pop(); // remove closure information field
                    }
                }
                validInputs = validInputs.concat(dateTimeInputs);

                var inputInfo = {};
                for(var j = 0; j < validInputs.length; j++)
                {
                    var incidentName = validInputs[j].id.split(".")[1]
                    var container = doc.getElementById('element.incident.'+incidentName);
                    var inputName = container.getElementsByClassName('label-text')[0].textContent;
                    var info = {};
                    if(validInputs[j].dataset.type != undefined && 
                        validInputs[j].dataset.type.indexOf('date') > -1)
                    {
                        if(validInputs[j].value != "")
                        {
                            info['value'] = Date.parse(validInputs[j].value); // convert date string to number
                        }
                        else
                        {
                            info['value'] = validInputs[j].value;                            
                        }
                    }
                    else
                    {
                        info['value'] = validInputs[j].value.replace(",",""); // remove any ',' chars                        
                    }
                    info['id'] = validInputs[j].id;
                    inputInfo[inputName] = info;
                }
                
                sendResponse(inputInfo);
                break;
            
            // Request from popup.js to update input value
            case 'OutputInfo':
                var doc = window.frames['gsft_main'].document;
                var outputField = doc.getElementById(request.outputId);
                var newVal = request.outputValue;
                if(request.outputId.indexOf('int') > 0) // will not work for custom field names
                {
                    outputField.value = request.outputValue.split(".")[0]; // round integers
                    newVal = outputField.value;
                }
                else if(outputField.dataset.type != undefined)
                {
                    // Convert date / time objects from milliseconds to human readable string
                    switch(outputField.dataset.type)
                    {
                        case "glide_element_date_time":
                            var d = new Date(parseFloat(request.outputValue));
                            outputField.value =  d.getFullYear() + "-" +
                                                ("0"+(d.getMonth()+1)).slice(-2) + "-" +
                                                ("0" + d.getDate()).slice(-2) + " " +
                                                ("0" + d.getHours()).slice(-2) + ":" + 
                                                ("0" + d.getMinutes()).slice(-2)+ ":" + 
                                                ("0" + d.getSeconds()).slice(-2);
                            break;
                        case "glide_element_date":
                            var d = new Date(parseFloat(request.outputValue));
                            outputField.value =  d.getFullYear() + "-" +
                                                ("0"+(d.getMonth()+1)).slice(-2) + "-" +
                                                ("0" + d.getDate()).slice(-2);
                            break;
                        default:
                            outputField.value = request.outputValue;
                            break;
                        
                    }
                }
                else
                {
                    outputField.value = request.outputValue;
                }
                sendResponse({success: true, newValue: newVal});
                break;
 
            default:
                console.log("Received unhandled request subject: "+request.subject);
                sendResponse({success: false});
        }
    }
});