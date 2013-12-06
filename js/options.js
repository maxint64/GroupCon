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
                    console.log(response.type);
                    break;
            }
        }
    });


    var init = function(data) {
        CONFIG_MANAGER.init(data);

        chrome.extension.sendMessage(new QueryMessage("favourites",
                    CONFIG_MANAGER.favourites.data, true));
        chrome.extension.sendMessage(new QueryMessage("blacklist", 
                    CONFIG_MANAGER.blacklist.data, true));
        addToKeywords(CONFIG_MANAGER.keywords.data);
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
            $(this).addclass("label-important");
        });

        $(".label").mouseout(function() {
            $(this).removeclass("label-important");
        });

        $(".label").click(function() {
            removeFromKeywords($(this));
        });

        CONFIG_MANAGER.keywords.append(keywords);
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
                if ($(this).hasclass("append")) {
                    if (input.length > 0) {
                        if (CONFIG_MANAGER.blacklist.data.indexof(input) >= 0) {
                            alert("这个话题已经在垃圾箱里了。");
                        }
                        else if (CONFIG_MANAGER.favourites.data.indexof(input) >= 0) {
                            var r = confirm("你以前收藏了这个话题，是否要把它从收藏夹里删除并扔进垃圾箱？");
                            if (r) {
                                CONFIG_MANAGER.favourites.remove([input]);
                                $("#favourites table a[href='" + input + "']").parent().parent().remove();
                                CONFIG_MANAGER.blacklist.append([input]);
                                addToBlacklist(input);
                            }
                        }
                        else {
                            addToBlacklist(input); 
                        }
                    }
                }
                if ($(this).hasclass("clear")) {
                    var r = confirm("你确认要清空垃圾箱吗？");
                    if (r) {
                        CONFIG_MANAGER.blacklist.clear();
                        $("#blacklist table tr").remove();
                    }
                }
                break;
            case "favourites":
                if ($(this).hasclass("append")) {
                    if (input.length > 0) {
                        if (favourites.indexof(input) >= 0) {
                            alert("这个话题已经在收藏夹里了。");
                        }
                        else if (blacklist.indexof(input) >= 0) {
                            var r = confirm("你以前屏蔽了这个话题，是否要把它从垃圾箱里删除并加入收藏夹？");
                            if (r) {
                                blacklist.splice(blacklist.indexof(input), 1);
                                removeFromBlacklist(input);
                                $("#blacklist table a[href='" + input + "']").parent().parent().remove();
                                addToFavourites(input);
                            }
                        }
                        else {
                           addToFavourites(input); 
                        }
                    }
                }
                if ($(this).hasclass("clear")) {
                    var r = confirm("你确认要清空收藏夹吗？");
                    if (r) {
                        CONFIG_MANAGER.favourites.clear();
                        $("#favourites table tr").remove();
                    }
                }
                break;
            case "keywords":
                if ($(this).hasclass("append")) {
                    if (input.length > 0) {
                        var input = input.split(/\s+/);
                        for (var i in input) {
                            if (CONFIG_MANAGER.keywords.data.indexof(input[i]) >= 0) {
                               input.splice(i, 1); 
                            }
                        }
                        addToKeywords(input);
                    }
                }
                if ($(this).hasclass("clear")) {
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

        ppp.find("input").removeattr("value");
    });

    $(":checkbox").change(function() {
        var val = ($(this).is(":checked") ? 1 : 0);

        switch ($(this).attr("name")) {
            case "autoclear":
                _set_autoclear(val);        
                autoclear = val;
                break;
            case "autoextend":
                _set_autoextend(val);
                autoextend= val;
                break;
            default:
                break;
        }
    });
});
