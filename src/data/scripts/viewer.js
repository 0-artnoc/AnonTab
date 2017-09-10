// A reference to the current origin
var origin = location.origin;

/**
 * Pass all given data to the parent.
 * @param data {object}, a data container object.
 * @return void.
 */
function passData(data) {
    'use strict';
    parent.postMessage(data, origin);
}

/**
 * Handle all messages sent from the main window.
 * @param msgEv {object}, a message event.
 * @return void.
 */
window.onmessage = function (msgEv) {
    'use strict';
    var styleEl;
    var data = msgEv.data;
    var proxy = data.proxyUrl;
    var type = data.dataType;
    var dataVal = data.dataVal;
    var msgOrigin = msgEv.origin || msgEv.originalEvent.origin;
    /**
     * Modify the `innerHTML` property of the body element.
     * @param data {string}, some HTML markup or a data URL.
     * @param isResource {boolean} optional, flags resources' data.
     * @return void.
     */
    var setBody = function(dataVal, isResource) {
        var body = document.body;
        if (isResource) {
            body.textContent = dataVal;
            body.style.wordWrap = 'break-word';
        } else {
            body.style.wordWrap = 'initial';
            body.innerHTML = dataVal;
        }
    };
    /**
     * Prefix all links by '#'.
     * @return void.
     */
    var linkify = function() {
        var link, href;
        var links = document.links;
        var index = links.length;
        while (index--) {
            link = links[index];
            href = decodeURIComponent(link.href);
            if (href.indexOf(proxy) === 0) {
                href = '#' + href.replace(proxy, '');
            } else {
                href = href.replace(/^[^#]*/, '#');
            }
            link.href = href;
        }
    };
    /**
     * Make GET forms functional.
     * @return void.
     */
    var formify = function() {
        var form, formAction;
        var forms = document.forms;
        var index = forms.length;
        /**
         * Submit a GET form indirectly.
         * @param ev {object}, a submit event.
         * @return void.
         */
        var submitForm = function(ev) {
            var params = [];
            var buildQuery = function(container) {
                var el, paramValue;
                var childElms = container.children;
                var index = childElms.length;
                while (index--) {
                    el = childElms[index];
                    if (el.hasAttribute('name')) {
                        paramValue = '=' + (el.value || '');
                        params.push(el.name + paramValue);
                    } else if (el.children) {
                        buildQuery(el);
                    }
                }
            };
            buildQuery(this);
            formAction = decodeURIComponent(this.action.replace(proxy, ''));
            location.hash = encodeURI(formAction + '?' + params.join('&'));
            ev.preventDefault();
        };
        /**
         * Handle unsupported form types.
         * @param ev {object}, a submit event.
         * @return void.
         */
        var handleForm = function(ev) {
            alert('Form type not supported.');
            ev.preventDefault();
        };
        while (index--) {
            form = forms[index];
            if (form.method === 'get' && form.action) {
                form.onsubmit = submitForm;
            } else {
                form.onsubmit = handleForm;
            }
        }
    };
    /**
     * View media elements.
     * @param url {string}, a URL string.
     * @param type {string}, the element's tag name.
     * @return void.
     */
    var viewMedia = function(url, type) {
        var el = document.createElement(type);
        el.src = url;
        el.controls = true;
        el.onload = function() {
            passData({spinner: 'off'});
        };
        el.onerror = function() {
            url = decodeURIComponent(url.replace(proxy, ''));
            passData({linkUrl: url, type: 'text'});
        };
        setBody('');
        document.body.appendChild(el);
        passData({spinner: 'on'});
    };
    if (msgOrigin !== origin) {
        return;
    }
    if (type === 'document') {
        setBody(dataVal);
        linkify();
        formify();
    } else if (type === 'styles') {
        styleEl = document.createElement('style');
        styleEl.innerHTML = dataVal;
        document.body.appendChild(styleEl);
    } else if (type === 'img' ||
                  type === 'audio' ||
                      type === 'video') {
        viewMedia(dataVal, type);
    } else if (type === 'resource') {
        setBody(dataVal, true);
    } else if (type === 'href') {
        if (dataVal === location.hash.slice(1)) {
            // Reset the hash silently.
            history.replaceState(null, null, '#');
        }
        location.hash = dataVal;
    } else {
        setBody('');
    }
};

/**
 * Handle user navigations.
 * @return void.
 */
window.onhashchange = function() {
    'use strict';
    var anchor;
    var hash = location.hash.slice(1);
    if (hash) {
        if (hash.indexOf('#') !== 0) {
            passData({linkUrl: hash});
        } else {
            anchor = document.getElementsByName(hash.slice(1))[0];
            if (typeof anchor === 'object') {
                anchor.scrollIntoView();
            }
        }
    }
};
