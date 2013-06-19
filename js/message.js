var _add_to_trash = function(url) {
    chrome.extension.sendMessage({
        cmd: "append", 
        type: "trash", 
        url: url, 
    });
};

var _add_to_like = function(url) {
    chrome.extension.sendMessage({
        cmd: "append",
        type: "like",
        url: url
    });
};

var _add_to_keys = function(keys) {
    chrome.extension.sendMessage({
        cmd: "append",
        type: "keys",
        keys: keys
    });
};

var _remove_from_like = function(url) {
    chrome.extension.sendMessage({
        cmd: "remove",
        type: "like",
        url: url
    });
};

var _remove_from_trash = function(url) {
    chrome.extension.sendMessage({
        cmd: "remove",
        type: "trash",
        url: url
    });
};


var _remove_from_keys = function(keys) {
    chrome.extension.sendMessage({
        cmd: "remove",
        type: "keys",
        keys: keys
    });
};

var _set_autoclear = function(autoclear) {
    chrome.extension.sendMessage({
        cmd: "config",
        type: "autoclear",
        autoclear: autoclear
    });
};

var _set_extend = function(extend) {
    chrome.extension.sendMessage({
        cmd: "config",
        type: "extend",
        extend: extend
    });
};
