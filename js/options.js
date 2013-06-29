$(function() {
    var icon_remove = "<i class='icon-remove' title='删除'></i>"; 

    chrome.extension.onMessage.addListener(function(msg, sender) {
        if (sender.tab) {
            if (sender.tab.url.indexOf("background") >= 0) {
                var garbage = [];
                var valid = [];
                var loading = $("#" + msg.type + " .loading");
                var table = $("#" + msg.type + " table");
                var list;

                if (msg.type == "favourites") {
                    list = favourites;
                }
                else {
                    list = blacklist;
                }

                for (var index in msg.result) {
                    var info = msg.result[index];
                    var a = $("<a></a>");
                    a.attr("href", info.url); 
                    if (! info.err) {
                        a.text(trunc(info.title, 50));
                    }
                    else if (info.err == "404" && autoclear) {
                        var pos = list.indexOf(info.url);
                        if (pos >= 0) {
                            garbage.push(info.url)
                            list.splice(list.indexOf(info.url), 1);
                        }

                        if (loading.size() == 0) {
                            alert("此话题不存在或已被删除");
                        }

                        continue;
                    }
                    else if (info.err == "403") {
                        a.text("【呃……请点击链接输入验证码】");
                    }
                    else {
                        a.text("【此话题不存在或已被删除】");
                    }

                    var tr = $("<tr><td></td></tr>");
                    tr.find("td").append(a);
                    tr.find("td").append(icon_remove);
                    table.append(tr);
                    valid.push(info.url);
                    console.log("IN LOOP " + table.find("tr").size());
                }

                if (loading.size() > 0) {
                    table.css("visibility", "visible");
                    loading.remove();
                    console.log("AFTER LOOP 1");
                }
                
                if (valid.length > 0) {
                    if (msg.type == "favourites")
                        _add_to_favourites(valid);
                    else
                        _add_to_blacklist(valid);
                    //不能使用concat(),此函数返回一个新数组并不修改原数组
                    for (var i in valid)
                        list.push(valid[i]);
                }
                
                $("#" + msg.type + " .icon-remove").click(function() {
                    if (msg.type == "favourites")
                        removeFromLike($(this).parent().parent());
                    else
                        removeFromTrash($(this).parent().parent());
                });

                if (autoclear && garbage.length > 0) {
                    if (msg.type == "favourites")
                        _remove_from_favourites(grabage);
                    else
                        _remove_from_blacklist(garbage);
                }
            }
        }
    });

    var addToTrash = function(url) {
        chrome.extension.sendMessage({cmd: "query", type: "blacklist", blacklist: [url], simplify: 1});
    };

    var addToLike = function(url) {
        chrome.extension.sendMessage({cmd: "query", type: "favourites", favourites: [url], simplify: 1});
    };

    var addToKeys = function(keywords) {
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
            removeFromKeys($(this));
        });

        _add_to_keywords(keywords);
    };

    var removeFromTrash = function(e) {
        var url = e.find("a").attr("href");
        blacklist.splice(blacklist.indexOf(url), 1);
        _remove_from_blacklist([url]);
        e.remove();
    };

    var removeFromLike = function(e) {
        var url = e.find("a").attr("href");
        favourites.splice(favourites.indexOf(url), 1);
        _remove_from_favourites([url]);
        e.remove();
    };

    var removeFromKeys = function(e) {
        var key = $.trim(e.text());
        keywords.splice(keywords.indexOf(key), 1);
        _remove_from_keywords([key]);
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
                        if (blacklist.indexOf(input) >= 0) {
                            alert("这个话题已经在垃圾箱里了。");
                        }
                        else if (favourites.indexOf(input) >= 0) {
                            var r = confirm("你以前收藏了这个话题，是否要把它从收藏夹里删除并扔进垃圾箱？");
                            if (r) {
                                favourites.splice(favourites.indexOf(input), 1);
                                _remove_from_favourites([input]);
                                $("#favourites table a[href='" + input + "']").parent().parent().remove();
                                addToTrash(input);
                            }
                        }
                        else {
                           addToTrash(input); 
                        }
                    }
                }
                if ($(this).hasClass("clear")) {
                    var r = confirm("你确认要清空垃圾箱吗？");
                    if (r) {
                        _remove_from_blacklist(blacklist);
                        $("#blacklist table tr").remove();
                    }
                }
                break;
            case "favourites":
                if ($(this).hasClass("append")) {
                    if (input.length > 0) {
                        if (favourites.indexOf(input) >= 0) {
                            alert("这个话题已经在收藏夹里了。");
                        }
                        else if (blacklist.indexOf(input) >= 0) {
                            var r = confirm("你以前屏蔽了这个话题，是否要把它从垃圾箱里删除并加入收藏夹？");
                            if (r) {
                                blacklist.splice(blacklist.indexOf(input), 1);
                                _remove_from_blacklist([input]);
                                $("#blacklist table a[href='" + input + "']").parent().parent().remove();
                                addToLike(input);
                            }
                        }
                        else {
                           addToLike(input); 
                        }
                    }
                }
                if ($(this).hasClass("clear")) {
                    var r = confirm("你确认要清空收藏夹吗？");
                    if (r) {
                        _remove_from_favourites(favourites);
                        $("#favourites table tr").remove();
                    }
                }
                break;
            case "keywords":
                if ($(this).hasClass("append")) {
                    if (input.length > 0) {
                        var input = input.split(/\s+/);
                        for (var i in input) {
                            if (keywords.indexOf(input[i]) >= 0) {
                               input.splice(i, 1); 
                            }
                        }
                        addToKeys(input);
                    }
                }
                if ($(this).hasClass("clear")) {
                    var r = confirm("你确认要清空屏蔽关键词列表吗？");
                    if (r) {
                        _remove_from_keywords(keywords);
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

    chrome.extension.sendMessage({cmd: "all"}, function(data) {
        autoextend = data.autoextend;
        autoclear = data.autoclear;
        favourites = data.favourites;
        blacklist = data.blacklist;
        keywords = data.keywords;

        chrome.extension.sendMessage({cmd: "query", type: "favourites", favourites: favourites, simplify: 1});
        chrome.extension.sendMessage({cmd: "query", type: "blacklist", blacklist: blacklist, simplify: 1});

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
            removeFromKeys($(this));
        });

        if (autoextend)
            $(":checkbox[name='autoextend']").attr("checked", true);

        if (autoclear)
            $(":checkbox[name='autoclear']").attr("checked", true);
    });
});
