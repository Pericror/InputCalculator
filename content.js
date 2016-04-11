// Tell the background page to show the page action
chrome.runtime.sendMessage({
    from:    'content',
    subject: 'showPageAction'
});

// Listen for popup info request or calculation
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.from === 'popup')
    {
        if(request.subject === 'InputInfo') {

            var doc = window.frames["gsft_main"].document;

            var inputElements = doc.querySelectorAll("input");
            var inputsArray = Array.prototype.slice.call(inputElements);
            var validInputs = inputsArray.filter(function(x){
                                                    return (x.className.indexOf('integer') != -1 
                                                    || x.className.indexOf('decimal') !=-1)
                                                });

            var inputInfo = {};
            for( var i = 0; i < validInputs.length; i++)
            {
                var incidentName = validInputs[i].id.split(".")[1]
                var container = doc.getElementById('element.incident.'+incidentName);
                var inputName = container.getElementsByClassName("label-text")[0].textContent;
                var info = {}
                info['value'] = validInputs[i].value;
                info['id'] = validInputs[i].id;
                inputInfo[inputName] = info;
            }

            console.log(inputInfo);

            sendResponse(inputInfo);
        }
        else if( request.subject == "CalculateInput")
        {
            console.log("Received from popup: "+request.data);
            //eval(request.data);
            sendResponse({success: true});
        }
    }
});