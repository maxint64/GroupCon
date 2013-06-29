var DEBUG = false;

var CONFIG = null;

function Config() {
    if (CONFIG === null) {
        this._storage_ = localStorage;
        this._separator_ = ",";
        this.prop = ["favorites", "blacklist", "keywords", "autoextend", "autoclear"];
        this.setItem(this.prop[0], []);
        this.setItem(this.prop[1], []);
        this.setItem(this.prop[2], []);
        this.setItem(this.prop[3], 0);
        this.setItem(this.prop[4], 0);

        CONFIG = this;
    }

    return CONFIG;
}

Config.prototype.getItem = function(property) {
    var items = this._storage_.getItem(property);
    var number = Number(items);
    if (typeof(number) == typeof(0)) {
        return number;
    }
    else {
        return items.split(this._separator_);
    }
};

Config.prototype.setItem = function(property, value) {
    this._storage_.setItem(property, value);
};

Config.prototype.appendItem = function(property, value) {
    var items = this.getItem(property);
    for (var i in value) {
        var pos = items.indexOf(value[i]);
        if (pos < 0) {
            items.push(value[i]);
        }
    }
    this.setItem(property, items);
};

Config.prototype.removeItem = function(property, value) {
    var items = this.getItem(property);
    for (var i in value) {
        var pos = items.indexOf(value[i]);
        if (pos >= 0) {
            items.splice(pos, 1);
        }
    }
    this.setItem(property, items);
};

Config.prototype.favorites = {
    append: function(url) {
        this.appendItem(this.prop[0], url);
    },
    remove: function(url) {
        this.removeItem(this.prop[0], url);
    },
    clear: function() {
        this.setItem(this.prop[0], []);
    },
};

Config.prototype.blacklist = {
    append: function(url) {
        this.appendItem(this.prop[1], url);
    },
    remove: function(url) {
        this.removeItem(this.prop[1], url);
    },
    clear: function() {
        this.setItem(this.prop[1], []);
    },
};

Config.prototype.keywords = {
    append: function(words) {
            this.appendItem(this.prop[2], words);
    },
    remove: function(words) {
            this.removeItem(this.prop[2], words);
    },
    clear: function() {
        this.setItem(this.prop[2], []);
    },
};

Config.prototype.autoclear = {
    set: function(value) {
        this.setItem(this.prop[3], value);
    },
};

Config.prototype.autoextend = {
    set: function(value) {
        this.setItem(this.prop[4], value);
    },
};

Config.prototype.getJSON() {
    return {
        favorites: this.getItem(this.prop[0]),
        blacklist: this.getItem(this.prop[1]),
        keywords: this.getItem(this.prop[2]),
        autoextend: this.getItem(this.prop[3]),
        autoclear: this.getItem(this.prop[4]),
    };
}

function TopicBuilder(tabID, args) {
    this.tabID = tabID;
    this.urls = args.urls;
    this.simplified = args.simplified;
    this.type = args.type
    this.topics = [];
}

TopicBuilder.prototype.buildAndSend = function() {
    var builder = this;
    var tabID = this.tabID;
    var urls = builder.urls;
    var topics = builder.topics;
    var simplified = simplified;

    if (urls.length == 0) {
        chrome.extension.sendMessage(tabID, topics);
    }

    for (var i in urls) {
        $.ajax({
            url: urls[i],
            success: function(html) {
                topics.push(new Topic(this.url, html).getJSON(simplified));
            },
            statusCode: {
                403: function() {
                    topic.push(new ErrorTopic(this.url, "【呃……请打开链接输入验证码】"));
                },
                404: function() {
                    topic.push(new ErrorTopic(this.url, "【本话题不存在或已被删除】"));
                }
            },
            complete: function() {
                if (topics.length == urls.length) {
                    chrome.extension.sendMessage(tabID, {
                        type: builder.type, 
                        topics: topics,
                    });
                }
            }
        });
    }
}

function ErrorTopic(url, msg) {
    return {
        url: url,
        topic: msg,
        title: msg,
    };
}

function Topic(url, html) {
    this.url = url;
    this.html = html;
}

Topic.prototype.getJSON = function(simplified) {
    this.parseTopicFromHtml(simplified);

    var json = {
        url: this.url,
        topic: this.topic,
        title: this.title,
    };

    if (! simplified) {
        json["replyNumber"] = this.replyNumber;
        json["fromatedLastReplyTime"] = this.formatLastReplyTime();
        json["groupName"] = this.groupName;
        json["groupUrl"] = this.groupUrl;
    }

    return json;
}

Topic.prototype.parseTopicFromHtml = function(simplified) {
    try {
        if (!!! this.html) {
            throw new Error("INVALID HTML");
        }

        var htmlObj = $(this.html);

        this.topic = $.trim(htmlObj.find("h1").text());
        this.title = $.trim(htmlObj.find("table.infobox td.tablecc").text()).substr(3);
        if (this.title.length == 0) {
            this.title = this.topic;
        }

        if (simplified) {
            return;
        }

        this.groupName = htmlObj.find(".group-item .title a").text();
        this.groupUrl = htmlObj.find(".group-item .title a").attr("href");

        var pageNumber = 1;
        if (!! htmlObj.find(".paginator").size()) {
            pageNumber = htmlObj.find(".paginator>a:last").text();

            var url += "?start=" + (pageNumber - 1)*100; 
            var html = $.ajax({
                url: url,
                async: false,
            }).responseText;

            if (!! html) {
                htmlObj = $(html);
            }
            else {
                throw new Error("INVALID HTML");
            }
        }

        this.replyNumber = (pageNumber - 1)*100 + htmlObj.find("ul#comments>li").size();
        this.lastReplyTime = htmlObj.find(".pubtime:last").text();
        this.publicTime = htmlObj.find("h3 span.color-green").text();

        return;
    }
    catch(err) {
        console.log(err);
    }
};

Topic.prototype.formatLastReplyTime = function() {
    if (this.replayNumber == 0) {
        lastReplyTime = this.publicTime;
    }
    else {
        lastReplyTime = this.lastReplyTime;
    }

    lastReplyTime = this.lastReplyTime.split(" ");
    var date = lastReplyTime[0].split("-");
    var time = lastReplyTime[1].split(":");

    var i = parseInt;
    var now = new Date();
    var publicTime = new Date();
    publicTime.setFullYear(i(date[0]), i(date[1])-1, i(date[2]);
    publicTime.setHours(i(time[0]));
    publicTime.setMinutes(i(time[1]));
    publicTime.setSeconds(i(time[2]));

    //时间差在一小时之内的，显示时间差
    //在两天内的，显示时间
    //在一年内的，显示日期
    //一年以上显示年差
    var diff = i((now.getTime() - publicTime.getTime())/1000, 10);
    if (diff < 1) {
        return "刚刚";
    }
    else if (diff < 60) {
        return diff + "秒前";
    }
    else if (diff < 3600) {
        return i(diff/60, 10) + "分钟前";
    }
    else {
        if (now.getFullYear() == i(date[0])) {
            if (now.getMonth() + 1 == i(date[1])) {
                if (now.getDate() == i(date[2])) {
                    return "今天" + time[0] + ":" + time[1];
                }
                else if (now.getDate() == i(date[2]) + 1) {
                    return "昨天" + time[0] + ":" + time[1];
                }
                else {
                    return date[1] + "-" + date[2];
                }
            }
            else {
               return date[1] + "-" + date[2];
            }
        }
        else {
            return now.getFullYear() - i(date[0]) + "年前";
        }
    }
};

function MessageProcessor(tabID, msg) {
    this.tabID = tabID;
    this.msg = msg;
}

MessageProcessor.prototype.process = function() {
    var cmd = this.msg.cmd;
    this[["process", cmd].join("_")]();
}

MessageProcessor.prototype.process_all = function() {
    chrome.extension.sendMessage(this.tabID, new Config().getJSON());
}

MessageProcessor.prototype.process_query = function() {
    var msg = this.msg;
    if (msg.simplified == undefined) {
        msg.simplified = 1;
    }
    new TopicBuilder(this.tabID, msg).buildAndSend();
}

MessageProcessor.prototype.property_config = function() {
    var msg = this.msg;
    new Config()[msg.property][msg.operation](msg.data);
}

chrome.extension.onMessage.addListener(function(msg, sender) {
    if (sender.tab) {
        if (sender.tab.url.indexOf("background") < 0) {
           new MessageProcessor(sender.tab.id, msg).process();
        }
    }
});
