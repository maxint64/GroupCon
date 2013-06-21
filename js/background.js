var DEBUG = false;

var getHtml = function(url) {
    return $.ajax({
        url: url,
        async: false,
        success: function(data) {
            if (DEBUG) {
                console.log(data);
            }
            return data;
        },
        error: function(xhr, err_obj) {
            if (DEBUG) {
                console.log(xhr);
                console.log(error);
            }
            return 0;
        }
    }).responseText;
};

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

var getTopicInfo = function(list, simplify) {
    var result = [];

    for (var index in list) {
        var url = list[index];
        var html = getHtml(url);

        //GHOST BUG: 之前这里总是报错，在stackoverflow上看到说jQuery不能解析有<head>标签的html,
        //所以把<body>中的内容取出放在<div>中，但后来又发现就算不这样做也不会报错
        //html = "<div>" + html.replace(/^[\s\S]*<body.*?>|<\/body>[\s\S]*$/g, '') + "</div>";

        if (!! html) {
            var info = {};
            var t = $(html);
            info.url = url;
            info.topic = $.trim(t.find("h1").text());

            //当前topic不存在或已被删除
            if (info.topic.length == 0) {
                info.err = 1;
                result.push(info);
                continue;
                debugger;
            }

            info.title = $.trim(t.find("table.infobox td.tablecc").text()).substr(3);
            //debugger;
            if (info.title.length == 0)
                info.title = info.topic;

            if (simplify) {
                result.push(info);
                continue;
            }

            info.group_name = t.find(".group-item .title a").text();
            info.group_url = t.find(".group-item .title a").attr("href");
            var page_num = 1;
            //如果有分页则用最后一页的html替换之前的
            if (!! t.find(".paginator").size()) {
                page_num = t.find(".paginator>a:last").text();
                url += "?start=" + (page_num-1)*100; 
                html = getHtml(url);
                if (!! html) {
                    t = $(html);
                }
                else {
                    if (DEBUG) {
                        console.log(url + "NOT FOUND");
                        console.log(html);
                    }
                    info.err = 1;
                    result.push(info);
                    continue;
                }
            }
            info.reply_num = (page_num-1)*100 + t.find("ul#comments>li").size();
            info.last_reply = t.find(".pubtime:last").text();
            info.pub_time = t.find("h3 span.color-green").text();
            if (info.reply_num == 0)
                info.last_reply_ex = calcTime(info.pub_time);
            else
                info.last_reply_ex = calcTime(info.last_reply);
            result.push(info);
        }
        else {
            if (DEBUG) {
                console.log(url + " NOT FOUND");
                console.log(html);
            }
            info.err = 1;
            result.push(info);
            continue;
        }
    }

    return result;
};

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
    if (sender.tab) {
        var s = localStorage;
        var like = (!! s.like) ? s.like.split(",") : [];
        var trash = (!! s.trash) ? s.trash.split(",") : [];
        var keys = (!! s.keys) ? s.keys.split(",") : [];
        var extend = (!! s.extend) ? parseInt(s.extend) : 1;
        var autoclear = (!! s.autoclear) ? parseInt(s.autoclear) : 0;

        //当时为什么要这么写呢？可能想为option和myscript提供两套不通的功能吧...
        //但现在似乎没必要就先注释掉好了=_=
        //if (sender.tab.url.indexOf("options") < 0) {
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
                switch (msg.type) {
                    case "like":
                        sendResponse(getTopicInfo(msg.like, msg.simplify));
                        break;
                    case "trash":
                        sendResponse(getTopicInfo(msg.trash, msg.simplify));
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
        //}
        //else {
        //    console.log('WTF!');
        //}
    }
});
