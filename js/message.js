var trunc = function(str, len) {
    return (str.length > len) ? str.substr(0, len) + "..." : str;
};

function Message(cmd) {
    this.cmd = cmd;
}

function QueryMessage(cmd, type, urls, simplified) {
    Message.call(this, cmd);
    this.type = type;
    this.urls = urls;
    this.simplified = simplified;
}

function ConfigMessage(cmd, property, operation, data) {
    Message.call(this, cmd);
    this.property = property;
    this.operation = operation;
    this.data = data;
}
