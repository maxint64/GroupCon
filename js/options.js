$(function() {
    var CONFIG_MANAGER = new ConfigManager();

    chrome.extension.onMessage.addListener(function(response, sender) {
        if (undefined === sender.tab) {
            switch (response.header.cmd) {
                case "all":
                    init(response.data);
                    break;
                case "query":
                    refresh(response.header.type, response.data);
                    break;
                default:
                    break;
            }
        }
    });


    var init = function(data) {
        CONFIG_MANAGER.init(data);

        if (CONFIG_MANAGER.autoclear.data) {
            $(":checkbox[name='autoclear']").attr("checked", "checked");
        }
        if (CONFIG_MANAGER.autoextend.data) {
            $(":checkbox[name='autoextend']").attr("checked", "checked");
        }

        addToKeywords(CONFIG_MANAGER.keywords.data);

        chrome.extension.sendMessage(new QueryMessage("favourites",
                    CONFIG_MANAGER.favourites.data, true));
        chrome.extension.sendMessage(new QueryMessage("blacklist", 
                    CONFIG_MANAGER.blacklist.data, true));
    };

    var refresh = function(type, data) {
        var garbage = [];
        var valid = [];
        var loading = $("#" + type + " .loading");
        var table = $("#" + type + " table");
        var autoclear = CONFIG_MANAGER.autoclear.data;

        for (var index in data) {
            var topic = data[index];
            if (topic.error_code && autoclear) {
                garbage.push(topic.url)
                if (loading.size() == 0) {
                    alert("此话题不存在或已被删除");
                }
            }
            else {
                var a = $("<a></a>");
                a.attr("href", topic.url); 
                a.text(trunc(topic.title, 50));

                var tr = $("<tr><td></td></tr>");
                tr.find("td").append(a);
                tr.find("td").append("<i class='icon-remove' title='删除'></i>");
                table.append(tr);
                valid.push(topic.url);
            }
        }

        if (loading.size() > 0) {
            table.css("visibility", "visible");
            loading.remove();
        }
        
        if (valid.length > 0) {
            CONFIG_MANAGER[type].append(valid);
        }
        
        $("#" + type + " .icon-remove").click(function() {
            CONFIG_MANAGER[type].remove([$(this).prev().attr("href")]);
            $(this).parent().parent().remove();
        });

        if (autoclear && garbage.length > 0) {
            CONFIG_MANAGER[type].remove(garbage);
        }
    };

    var save = function(type, url) {
        CONFIG_MANAGER[type].append([url]);
        chrome.extension.sendMessage(new QueryMessage(type, [url], true));
    }; 
    
    var addToKeywords = function(keywords) {
        var field = $(".keywords-field");
        for (var index in keywords) {
            var k = keywords[index];
            var label = $("<span class='label' title='点击删除关键词'></span>");
            label.text(k);
            field.append(label);
        }

        $(".label").mouseover(function() {
            $(this).addClass("label-important");
        });

        $(".label").mouseout(function() {
            $(this).removeClass("label-important");
        });

        $(".label").click(function() {
            removeFromKeywords($(this));
        });
    };

    var removeFromKeywords = function(e) {
        var key = $.trim(e.text());
        CONFIG_MANAGER.keywords.remove([key]);
        e.remove();
    }

    $(".nav-tabs a").click(function(e) {
        e.preventDefault();
        $(this).tab("show");
    });

    $("button").click(function () {
        var ppp = $(this).parent().parent().parent();
        var input = $.trim(ppp.find("input").val());

        switch (ppp.attr("id")) {
            case "blacklist":
                if ($(this).hasClass("append")) {
                    if (input.length > 0) {
                        if (CONFIG_MANAGER.blacklist.data.indexOf(input) >= 0) {
                            alert("这个话题已经在垃圾箱里了。");
                        }
                        else if (CONFIG_MANAGER.favourites.data.indexOf(input) >= 0) {
                            var r = confirm("你以前收藏了这个话题，是否要把它从收藏夹里删除并扔进垃圾箱？");
                            if (r) {
                                CONFIG_MANAGER.favourites.remove([input]);
                                $("#favourites table a[href='" + input + "']").parent().parent().remove();
                                CONFIG_MANAGER.blacklist.append([input]);
                                save("blacklist", input);
                            }
                        }
                        else {
                            save("blacklist", input);
                        }
                    }
                }
                if ($(this).hasClass("clear")) {
                    var r = confirm("你确认要清空垃圾箱吗？");
                    if (r) {
                        CONFIG_MANAGER.blacklist.clear();
                        $("#blacklist table tr").remove();
                    }
                }
                break;
            case "favourites":
                if ($(this).hasClass("append")) {
                    if (input.length > 0) {
                        if (CONFIG_MANAGER.favourites.data.indexOf(input) >= 0) {
                            alert("这个话题已经在收藏夹里了。");
                        }
                        else if (CONFIG_MANAGER.blacklist.data.indexOf(input) >= 0) {
                            var r = confirm("你以前屏蔽了这个话题，是否要把它从垃圾箱里删除并加入收藏夹？");
                            if (r) {
                                CONFIG_MANAGER.blacklist.remove(input);
                                $("#blacklist table a[href='" + input + "']").parent().parent().remove();
                                save("favourites", input);
                            }
                        }
                        else {
                            save("favourites", input);
                        }
                    }
                }
                if ($(this).hasClass("clear")) {
                    var r = confirm("你确认要清空收藏夹吗？");
                    if (r) {
                        CONFIG_MANAGER.favourites.clear();
                        $("#favourites table tr").remove();
                    }
                }
                break;
            case "keywords":
                if ($(this).hasClass("append")) {
                    if (input.length > 0) {
                        var input = input.split(/\s+/);
                        var tmp = input;
                        for (var i in tmp) {
                            if (CONFIG_MANAGER.keywords.data.indexOf(tmp[i]) >= 0) {
                               input.splice(input.indexOf(tmp[i]), 1); 
                            }
                        }
                        CONFIG_MANAGER.keywords.append(input);
                        addToKeywords(input);
                    }
                }
                if ($(this).hasClass("clear")) {
                    var r = confirm("你确认要清空屏蔽关键词列表吗？");
                    if (r) {
                        CONFIG_MANAGER.keywords.clear();
                        $(".keywords-field").empty(); 
                    }
                }
                break;
            default:
                break;
        }

        ppp.find("input").removeAttr("value");
    });

    $(":checkbox").change(function() {
        var val = ($(this).is(":checked") ? 1 : 0);
        switch ($(this).attr("name")) {
            case "autoclear":
                CONFIG_MANAGER.autoclear.set(val);
                autoclear = val;
                break;
            case "autoextend":
                CONFIG_MANAGER.autoextend.set(val);
                autoextend = val;
                break;
            default:
                break;
        }
    });
});
