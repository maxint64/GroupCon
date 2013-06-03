var DEBUG = false;

getHtml = function(url) {
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

calcTime = function(str) {
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
    if (diff < 60)
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

getTopicInfo = function(topic_url) {
    var result = [];
    for (index in topic_url) {
        var url = topic_url[index];
        var html = getHtml(url);

        //GHOST BUG: 之前这里总是报错，在stackoverflow上看到说jQuery不能解析有<head>标签的html,
        //所以把<body>中的内容取出放在<div>中，但后来又发现就算不这样做也不会报错
        //html = "<div>" + html.replace(/^[\s\S]*<body.*?>|<\/body>[\s\S]*$/g, '') + "</div>";

        if (!! html) {
            var info = {};
            var t = $(html);
            info.url = url;
            info.topic = $.trim(t.find("h1").text());
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
                    result.push(0);
                }
            }
            info.reply_num = (page_num-1)*100 + t.find("ul#comments>li").size();
            info.last_reply = t.find(".pubtime:last").text();
            info.last_reply_ex = calcTime(info.last_reply);
            debugger;
            result.push(info);
        }
        else {
            if (DEBUG) {
                console.log(url + " NOT FOUND");
                console.log(html);
            }
            result.push(0);
        }
    }
    return result;
};

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
    if (sender.tab) {
        s = localStorage;
        del_url = (!! s.del_url) ? s.del_url.split(",") : [];
        del_topic = (!! s.del_url) ? s.del_topic.split(",") : [];
        top_url = (!! s.top_url) ? s.top_url.split(",") : [];
        top_topic = (!! s.top_topic) ? s.top_topic.split(",") : [];

        if (sender.tab.url.indexOf("options") < 0) {
            switch (msg.cmd) {
                case "all":
                    sendResponse({
                        del_url: del_url,
                        del_topic: del_topic,
                        top_url: top_url,
                        top_topic: top_topic
                    });
                    break;
                case "append":
                    switch (msg.type) {
                        case "del":
                            var len = msg.del_url.length;
                            for (i = 0; i < len; i++) {
                                if (del_url.indexOf(msg.del_url[i]) < 0) {
                                    del_url.push(msg.del_url[i]);
                                    del_topic.push(msg.del_topic[i]);
                                }
                            }
                            break;
                        case "top":
                            var len = msg.top_url.length;
                            for (i = 0; i < len; i++) {
                                if (top_url.indexOf(msg.top_url[i]) < 0) {
                                    top_url.push(msg.top_url[i]);
                                    top_topic.push(msg.top_topic[i]);
                                }
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case "remove":
                    del_url = del_topic = top_url = top_topic = [];
                    break;
                case "query":
                    sendResponse(getTopicInfo(msg.topic_url));
                    break;
                default:
                    break;
            }
            s.del_url = del_url;
            s.del_topic = del_topic;
            s.top_url = top_url;
            s.top_topic = top_topic;
        }
        else {
            console.log('WTF!');
        }
    }
});
