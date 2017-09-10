/**
 * Create a new AnonTab instance.
 * @param linkUrl {string}, a URL string.
 * @param flag {string}, a context label.
 * @return void.
 */
function openTab(linkUrl, flag) {
    'use strict';
    var tabId;
    /**
     * Remove traces of AnonTab closed tabs.
     * @param tabId_ {number}, a tab ID.
     * @return void.
     */
    var cleanUp = function(tabId_) {
        var extensionURL = chrome.runtime.getURL('');
        var fileNames = ['main.html', 'viewer.html'];
        var index = fileNames.length;
        if (tabId === tabId_) {
            chrome.tabs.onRemoved.removeListener(cleanUp);
            chrome.browsingData.removeHistory({
                'since': (new Date()).getTime() - 1000
            });
            while (index--) {
                chrome.history.deleteUrl({url: extensionURL + fileNames[index]});
            }
        }
    };

    chrome.tabs.create({active: true, url: 'main.html'}, function(tab) {
        tabId = tab.id;
        if (flag === 'contextMenu') {
            chrome.tabs.onUpdated.addListener(function listener(tabId_, changeInfo) {
                if (tabId === tabId_ && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    chrome.tabs.sendMessage(tabId, {linkUrl: linkUrl, type: null});
                }
            });
        }
    });
    chrome.tabs.onRemoved.addListener(cleanUp);
}

chrome.browserAction.onClicked.addListener(openTab);

chrome.contextMenus.create({
    'title': 'Open Link in AnonTab',
    'contexts': ['link'],
    'onclick' : function(params) {
        'use strict';
        openTab(params.linkUrl, 'contextMenu');
    }
});
