var proxyInpt = document.getElementById('proxyInpt');
var hstsListInpt = document.getElementById('hstsListInpt');
var proxyUri = 'https://api.allorigins.win/raw?url=';
var hstsList = ['torproject.org', '*.torproject.org', '*.wikipedia.org',
    '*.facebook.com', 'github.com', 'twitter.com'];

/**
 * Change the `boxShadow` style property of a given element.
 * @param inputElement {object}, an `HTMLInputElement` object.
 * @param color {string}, a color name.
 * @return void.
 */
function setBoxShadowColor(inputElement, color) {
    'use strict';
    inputElement.style.boxShadow = '0 0 10px ' + color + ' inset';
}

/**
 * Save options to local storage.
 * @return void.
 */
function saveOptions() {
    'use strict';
    chrome.storage.local.set({
        proxy: proxyInpt.value,
        hstsList: hstsListInpt.value.replace(/\s/g, '').split(',')
    });
}

/**
 * Restore settings from local storage.
 * @param reset {boolean} optional, reset default settings.
 * @return void.
 */
function restoreSettings(reset) {
    'use strict';
    if (reset === true) {
        proxyInpt.value = proxyUri;
        hstsListInpt.value = hstsList;
    } else {
        chrome.storage.local.get({
            proxy: proxyUri,
            hstsList: hstsList
        }, function(items) {
            proxyInpt.value = items.proxy;
            hstsListInpt.value = items.hstsList;
        });
    }
}

/**
 * Display options status.
 * @param message {string}, a message to display.
 * @param isPersistent {boolean}, displays a message persistently.
 * @return void.
 */
function updateStatus(message, isPersistent) {
    'use strict';
    var interval;
    var status = document.getElementById('status');
    status.textContent = message;
    if (isPersistent) {
        interval = setInterval(function() {
            if (/\.{3}$/.test(status.textContent)) {
                status.textContent = status.textContent.slice(0, -2);
            } else if (message.indexOf(status.textContent) === 0) {
                status.textContent += '.';
            } else {
                clearInterval(interval);
            }
        }, 300);
    } else {
        setTimeout(function() {
            status.textContent = '';
        }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', restoreSettings);
document.getElementById('reset').addEventListener('click', function(ev) {
    'use strict';
    restoreSettings(true);
    saveOptions();
    updateStatus('Options reset.');
    setBoxShadowColor(proxyInpt, 'white');
    setBoxShadowColor(hstsListInpt, 'white');
    ev.preventDefault();
});
document.getElementById('form').addEventListener('submit', function(ev) {
    'use strict';
    var proxy = proxyInpt.value;
    var xhrReq = new XMLHttpRequest();
    /**
     * Indicate a validation error.
     * @return void.
     */
    var showError = function(message) {
        updateStatus("Couldn't validate proxy server.");
        setBoxShadowColor(proxyInpt, 'red');
    };

    setBoxShadowColor(hstsListInpt, 'green');
    setBoxShadowColor(proxyInpt, 'yellow');
    updateStatus('Validating proxy...', true);
    
    xhrReq.onload = function() {
        if (this.status === 200) {
            saveOptions();
            updateStatus('Changes saved.');
            setBoxShadowColor(proxyInpt, 'green');
        } else {
            showError();
        }
    };
    xhrReq.onerror = function() {
        showError();
    };
    xhrReq.open('GET', proxy + 'http://example.com');
    xhrReq.send();

    ev.preventDefault();
});
