$(function() {
    var CONFIG = null;

    function Config() {
        if (CONFIG === null) {
            this._storage_ = localStorage;
            this._separator_ = ",";
            this.setDefault("favourites", -1);
            this.setDefault("blacklist", -1);
            this.setDefault("keywords", -1);
            this.setDefault("autoextend", 0);
            this.setDefault("autoclear", 0);

            CONFIG = this;
        }

        return CONFIG;
    }

    Config.prototype.setDefault = function(property, value) {
        undefined === this._storage_[property] ? this._storage_[property] = value : null;
    };

    Config.prototype.getItem = function(property) {
        var items = this._storage_[property];
        var number = Number(items);
        if (number < 0) {
            return [];
        }
        else if (! isNaN(number)) {
            return number;
        }
        else {
            return items.split(this._separator_);
        }
    };

    Config.prototype.setItem = function(property, value) {
        this._storage_[property] = value;
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

    Config.prototype.favourites = {
        append: function(url) {
            CONFIG.appendItem("favourites", url);
        },
        remove: function(url) {
            CONFIG.removeItem("favourites", url);
        },
        clear: function() {
            CONFIG.setItem("favourites", -1);
        },
    };

    Config.prototype.blacklist = {
        append: function(url) {
            CONFIG.appendItem("blacklist", url);
        },
        remove: function(url) {
            CONFIG.removeItem("blacklist", url);
        },
        clear: function() {
            CONFIG.setItem("blacklist", -1);
        },
    };

    Config.prototype.keywords = {
        append: function(words) {
            CONFIG.appendItem("keywords", words);
        },
        remove: function(words) {
            CONFIG.removeItem("keywords", words);
        },
        clear: function() {
            CONFIG.setItem("keywords", -1);
        },
    };

    Config.prototype.autoclear = {
        set: function(value) {
            CONFIG.setItem("autoclear", value);
        },
    };

    Config.prototype.autoextend = {
        set: function(value) {
            CONFIG.setItem("autoextend", value);
        },
    };

    Config.prototype.getJSON = function() {
        return {
            favourites: this.getItem("favourites"),
            blacklist: this.getItem("blacklist"),
            keywords: this.getItem("keywords"),
            autoextend: this.getItem("autoextend"),
            autoclear: this.getItem("autoclear"),
        };
    }

    function TopicBuilder(tabID, args) {
        this.tabID = tabID;
        this.urls = args.urls;
        this.type = args.type;
        this.simplified = args.simplified;
        this.cmd = args.cmd
        this.topics = [];
    }

    TopicBuilder.prototype.buildAndSend = function() {
        var builder = this;
        var tabID = this.tabID;
        var urls = builder.urls;
        var topics = builder.topics;
        var simplified = builder.simplified;
        var header = {"cmd": builder.cmd, "type": builder.type};

        if (urls.length == 0) {
            chrome.tabs.sendMessage(tabID, new Response(header, topics));
        }

        for (var i in urls) {
            $.ajax({
                url: urls[i],
                success: function(html) {
                    topics.push(new Topic(this.url, html).getJSON(simplified));
                },
                statusCode: {
                    403: function() {
                        topics.push(new ErrorTopic(403, this.url, "【呃……请打开链接输入验证码】"));
                    },
                    404: function() {
                        topics.push(new ErrorTopic(404, this.url, "【本话题不存在或已被删除】"));
                    }
                },
                complete: function() {
                    if (topics.length == urls.length) {
                        chrome.tabs.sendMessage(tabID, new Response(header, topics));
                    }
                }
            });
        }
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
            json["lastReplyTime"] = this.lastReplyTime;
            json["formatedLastReplyTime"] = this.formatLastReplyTime();
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

                var url = this.url + "?start=" + (pageNumber - 1)*100; 
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
        if (this.replyNumber == 0) {
            lastReplyTime = this.publicTime;
        }
        else {
            lastReplyTime = this.lastReplyTime;
        }

        lastReplyTime = lastReplyTime.split(" ");
        var date = lastReplyTime[0].split("-");
        var time = lastReplyTime[1].split(":");

        var i = parseInt;
        var now = new Date();
        var publicTime = new Date();
        publicTime.setFullYear(i(date[0]), i(date[1])-1, i(date[2]));
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
        this[["process", this.msg.cmd].join("_")]();
    }

    MessageProcessor.prototype.process_all = function() {
        var header = {"cmd": this.msg.cmd, "type": "all"};
        chrome.tabs.sendMessage(this.tabID, new Response(header, new Config().getJSON()));
    }

    MessageProcessor.prototype.process_query = function() {
        var msg = this.msg;
        if (msg.simplified === undefined) {
            msg.simplified = false;
        }
        new TopicBuilder(this.tabID, msg).buildAndSend();
    }

    MessageProcessor.prototype.process_config= function() {
        var msg = this.msg;
        new Config()[msg.property][msg.operation](msg.data);
    }

    MessageProcessor.prototype.process_options= function() {
        var optionsUrl = chrome.extension.getURL('html/options.html');
        chrome.tabs.query({url: optionsUrl}, function(tabs) {
            if (tabs.length) {
                chrome.tabs.update(tabs[0].id, {active: true});
            } 
            else {
                chrome.tabs.create({url: optionsUrl});
            }
        });
    }

    function Response(header, data) {
        this.header = header;
        this.data = data;
    }

    chrome.extension.onMessage.addListener(function(msg, sender) {
        if (sender.tab) {
            if (sender.tab.url.indexOf("background") < 0) {
                new MessageProcessor(sender.tab.id, msg).process();
            }
        }
    });
});
