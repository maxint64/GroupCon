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

function Property(name, type) {
    this.name = name;
    this.type = type;
    this.data = (this.type != "simple" ? [] : 0);
}

Property.prototype.append = function(data) {
    for (var i in data) {
        if (this.data.indexOf(data[i]) < 0) {
            this.data.push(data[i]);
        }
    }
    chrome.extension.sendMessage(new ConfigMessage(this.name, "append", data));
};

Property.prototype.remove = function(data) {
    for (var i in data) {
        var index = this.data.indexOf(data[i]);
        if (index >= 0) {
            this.data.splice(index, 1);
        }
    }
    chrome.extension.sendMessage(new ConfigMessage(this.name, "remove", data));
};

Property.prototype.clear = function() {
    this.data = (this.type != "simple" ? [] : 0);
    chrome.extension.sendMessage(new ConfigMessage(this.name, "clear"));
};

function ConfigManager() {
    chrome.extension.sendMessage(new Message("all"));
}

ConfigManager.prototype.init = function(data) {
    for (var i in data) {
        this[i]["data"] = data[i];
    }
};

ConfigManager.prototype.favorites = new Property("favorites");

ConfigManager.prototype.blacklist = new Property("blacklist");

ConfigManager.prototype.keywords = new Property("keywords");

ConfigManager.prototype.autoextend = new Property("autoextend", "simple");

ConfigManager.prototype.autoclear = new Property("autoclear", "simple");

function ErrorTopic(url, content) {
    return {
        url: url,
        topic: content,
        title: content,
    };
}

var trunc = function(str, len) {
    return (str.length > len) ? str.substr(0, len) + "..." : str;
};
