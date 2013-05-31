var debug = false;

getTopicInfo = function(html) {
    var t = $(html);
    console.log(t);
}

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
                            for (index in msg.del_url) {
                                if (del_url.indexOf(msg.del_url[index] < 0))
                                    del_url.push(msg.del_url[index]);
                            }
                            for (index in msg.del_topic) {
                                if (del_topic.indexOf(msg.del_topic[index] < 0))
                                    del_topic.push(msg.del_topic[index]);
                            }
                            break;
                        case "top":
                            for (index in msg.top_url) {
                                if (top_url.indexOf(msg.top_url[index] < 0))
                                    top_url.push(msg.top_url[index]);
                            }
                            for (index in msg.top_topic) {
                                if (top_topic.indexOf(msg.top_topic[index] < 0))
                                    top_topic.push(msg.top_topic[index]);
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
                    $.ajax({
                        url: msg.topic_url,
                        success: function(data, str) {
                            topic_info = getTopicInfo(data);
                  //          sendResponse({
                  //              msg: 0,
                  //              topic_info: topic_info
                  //          });
                            if (debug) {
                                console.log(data);
                                console.log(str);
                            }
                        },
                        error: function(xhr, err_obj) {
                            sendResponse({
                                msg: 1
                            });
                            if (debug) {
                                console.log(xhr);
                                console.log(err_obj);
                            }
                        }
                    });
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
