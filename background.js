/*******************************************************************************
*
* Input Calculator Background JS
* ___________________________
* [2016] Pericror
* All Rights Reserved
* Use of this source code is governed by the license found in the LICENSE file.
*/

// Listens for content message to show page action or page
chrome.runtime.onMessage.addListener(function (msg, sender) {
    if ((msg.from === 'content') && (msg.subject === 'showPageAction')) {
        chrome.pageAction.show(sender.tab.id);
    }
    else if ((msg.from === 'popup') && (msg.subject === 'showLink')) {
          var newURL = "http://pericror.com/";
          chrome.tabs.create({ url: newURL });
    }
});