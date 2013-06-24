var DEBUG = false;

var getTopicInfo = function(target, type, list, simplify) {
    var result = [];
    var msg = {
        target: target,
        type: type,
        result: result
    };


    if (list.length == 0) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, msg);
        });
        return;
    }

    for (var i in list) {
        $.ajax({
            url: list[i],
            success: function(html) {
                result.push(parseHtml(this.url, html, simplify));
            },
            error: function() {
                result.push({err: 1});
            },
            complete: function() {
                if (result.length == list.length) {
                    if (target == "options")
                        chrome.extension.sendMessage(msg);
                    else {
                        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, msg);
                        });
                    }
                }
            }
        });
    }
}

var calcTime = function(str) {
    //debugger;
    str = str.split(" ");
    var date = str[0].split("-");
    var time = str[1].split(":");
    var i = parseInt;
    var now = new Date();
    var pub = new Date();
    pub.setFullYear(i(date[0]), i(date[1])-1, i(date[2]));
    pub.setHours(i(time[0]));
    pub.setMinutes(i(time[1]));
    pub.setSeconds(i(time[2]));
    var diff = i((now.getTime() - pub.getTime())/1000, 10);

    //时间差在一小时之内的，显示时间差
    //在两天内的，显示时间
    //在一年内的，显示日期
    //一年以上显示年差
    if (diff < 1)
        return "刚刚";
    else if (diff < 60)
        return diff + "秒前";
    else if (diff < 3600)
        return i(diff/60, 10) + "分钟前";
    else {
        if (now.getFullYear() == i(date[0]))
            if (now.getMonth()+1 == i(date[1]))
                if (now.getDate() == i(date[2]))
                    return "今天" + time[0] + ":" + time[1];
                else if (now.getDate() == i(date[2])+1)
                    return "昨天" + time[0] + ":" + time[1];
                else
                    return date[1] + "-" + date[2];
            else
               return date[1] + "-" + date[2];
        else
            return now.getFullYear() - i(date[0]) + "年前";
    }
};

var parseHtml = function(url, html, simplify) {
    console.log(url);
    if (!! html) {
        var info = {};
        var t = $(html);
        info.url = url;
        info.topic = $.trim(t.find("h1").text());

        //当前topic不存在或已被删除
        if (info.topic.length == 0) {
            info.err = 1;
            return info;
        }

        info.title = $.trim(t.find("table.infobox td.tablecc").text()).substr(3);
        //debugger;
        if (info.title.length == 0)
            info.title = info.topic;

        if (simplify) {
            return info;
        }

        info.group_name = t.find(".group-item .title a").text();
        info.group_url = t.find(".group-item .title a").attr("href");
        var page_num = 1;
        //如果有分页则用最后一页的html替换之前的
        if (!! t.find(".paginator").size()) {
            page_num = t.find(".paginator>a:last").text();
            url += "?start=" + (page_num-1)*100; 
            html = $.ajax({
                url: url,
                async: false,
            }).responseText;

            if (!! html) {
                t = $(html);
            }
            else {
                if (DEBUG) {
                    console.log(url + "NOT FOUND");
                    console.log(html);
                }
                info.err = 1;
                return info;
            }
        }
        info.reply_num = (page_num-1)*100 + t.find("ul#comments>li").size();
        info.last_reply = t.find(".pubtime:last").text();
        info.pub_time = t.find("h3 span.color-green").text();
        if (info.reply_num == 0)
            info.last_reply_ex = calcTime(info.pub_time);
        else
            info.last_reply_ex = calcTime(info.last_reply);
        return info;
    }
    else {
        if (DEBUG) {
            console.log(url + " NOT FOUND");
            console.log(html);
        }
        info.err = 1;
        return info;
    }
};

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
    if (sender.tab) {
        var s = localStorage;
        var like = (!! s.like) ? s.like.split(",") : [];
        var trash = (!! s.trash) ? s.trash.split(",") : [];
        var keys = (!! s.keys) ? s.keys.split(",") : [];
        var extend = (!! s.extend) ? parseInt(s.extend) : 1;
        var autoclear = (!! s.autoclear) ? parseInt(s.autoclear) : 0;

        //如果是background自己发出的消息则不处理
        //debugger;
        if (sender.tab.url.indexOf("background") < 0) {
            switch (msg.cmd) {
                case "all":
                    sendResponse({
                        like: like,
                        trash: trash,
                        keys: keys,
                        autoclear: autoclear,
                        extend: extend
                    });
                    break;
                case "append":
                    switch (msg.type) {
                        case "trash":
                            for (var i in msg.url) {
                                var url = msg.url[i];
                                if (trash.indexOf(url) < 0) {
                                    trash.push(url);
                                }
                            }
                            break;
                        case "like":
                            for (var i in msg.url) {
                                var url = msg.url[i];
                                if (like.indexOf(url) < 0) {
                                    like.push(url);
                                }
                            }
                            break;
                        case "keys":
                            for (var i in msg.keys) {
                                var k = msg.keys[i];
                                if (keys.indexOf(k) < 0) {
                                    keys.push(k);
                                }
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case "remove":
                    //debugger;
                    switch (msg.type) {
                        case "trash":
                            for (var i in msg.url) {
                                var index = trash.indexOf(msg.url[i]);
                                if (index >= 0) {
                                    trash.splice(index, 1);
                                }
                            }
                            break;
                        case "like":
                            for (var i in msg.url) {
                                var index = like.indexOf(msg.url[i]);
                                if (index >= 0) {
                                    like.splice(index, 1);
                                }
                            }
                            break;
                        case "keys":
                            for (var i in msg.keys) {
                                var index = keys.indexOf(msg.keys[i]);
                                if (index >= 0) {
                                    keys.splice(index, 1);
                                }
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case "query":
                    var target;
                    if (sender.tab.url.indexOf("options") >= 0)
                        target = "options";
                    else if (sender.tab.url.indexOf("group") >= 0)
                        target = "myscript"; 
                    else {
                        console.log("WTF SENDER");
                    }

                    console.log("sender");
                    console.log(sender.tab);
                    switch (msg.type) {
                        case "like":
                            getTopicInfo(target, msg.type, msg.like, msg.simplify);
                            break;
                        case "trash":
                            getTopicInfo(target, msg.type, msg.trash, msg.simplify);
                            break;
                        default:
                            break;
                    }
                    break;
                case "config":
                    switch (msg.type) {
                        case "autoclear":
                            autoclear = msg.autoclear;
                            break;
                        case "extend":
                            extend = msg.extend;
                            break;
                        default:
                            break
                    }
                    break;
                case "clear":
                    trash = like = keys = [];
                    extend = 1;
                    break;
                default:
                    break;
            }
            s.trash = trash;
            s.like = like;
            s.keys = keys;
            s.autoclear = autoclear;
            s.extend = extend;
        }
    }
});
