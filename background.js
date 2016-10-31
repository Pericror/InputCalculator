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
    //if ((msg.from === 'content') && (msg.subject === 'showPageAction')) {
    //    chrome.pageAction.show(sender.tab.id);
    //}
    if ((msg.from === 'popup') && (msg.subject === 'showLink')) {
        chrome.tabs.create({
            url : "https://pericror.com/servicenow"
        });
    }
});

// Updates the page action / fix to keep page action in url bar until chrome moves it out
// Previously done by runtime content message
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    var re = /(https?:\/\/(.+?\.)?service-now\.com(\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;\=]*)?)/g;
    var exp = new RegExp(re);
    if (changeInfo.status === "complete" && exp.test(tab.url)) {
        chrome.pageAction.show(tabId);
    }
});
