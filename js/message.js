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
