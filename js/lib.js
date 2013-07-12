var trunc = function(str, len) {
    return (str.length > len) ? str.substr(0, len) + "..." : str;
};

function Message(cmd) {
    this.cmd = cmd;
}

function QueryMessage(type, urls, simplified) {
    Message.call(this, "query");
    this.type = type;
    this.urls = urls;
    this.simplified = simplified;
}

function ConfigMessage(property, operation, data) {
    Message.call(this, "config");
    this.property = property;
    this.operation = operation;
    this.data = data;
}

var _add_to_favourites = function(data) {
    chrome.extension.sendMessage(new ConfigMessage("favorites", "append", data));
};

var _add_to_blacklist = function(data) {
    chrome.extension.sendMessage(new ConfigMessage("blacklist", "append", data));
};

var _add_to_keywords = function(data) {
    chrome.extension.sendMessage(new ConfigMessage("keywords", "append", data));
};

var _remove_from_favourites = function(data) {
    chrome.extension.sendMessage(new ConfigMessage("favorites", "remove", data));
};

var _remove_from_blacklist = function(data) {
    chrome.extension.sendMessage(new ConfigMessage("blacklist", "remove", data));
};

var _remove_from_keywords = function(data) {
    chrome.extension.sendMessage(new ConfigMessage("keywords", "remove", data));
};
