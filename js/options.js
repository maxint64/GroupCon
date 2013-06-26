$(document).ready(function() {
    var extend = true;
    var like = [];
    var trash = [];
    var keys = [];
    var icon_remove = "<i class='icon-remove' title='删除'></i>"; 

    chrome.extension.onMessage.addListener(function(msg, sender) {
        if (sender.tab) {
            if (sender.tab.url.indexOf("background")) {
                var garbage = [];
                var valid = [];

                var loading = $("#" + msg.type + " .loading");

                var table = $("#" + msg.type + " table");
                var list;
                if (msg.type == "like") {
                    list = like;
                }
                else {
                    list = trash;
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
                        a.text("【呃……请输入验证码】");
                    }
                    else {
                        a.text("【此话题不存在或已被删除】");
                    }

                    var tr = $("<tr><td></td></tr>");
                    tr.find("td").append(a);
                    tr.find("td").append(icon_remove);
                    table.append(tr);
                    valid.push(info.url);
                }

                if (autoclear && garbage.length > 0) {
                    if (msg.type == "like")
                        _remove_from_like(grabage);
                    else
                        _remove_from_trash(garbage);
                }

                $("#" + msg.type + " .icon-remove").click(function() {
                    if (msg.type == "like")
                        removeFromLike($(this).parent().parent());
                    else
                        removeFromTrash($(this).parent().parent());
                });

                if (loading.size() > 0) {
                    table.css("visibility", "visible");
                    loading.remove();
                }
                else if (valid.length > 0) {
                    if (msg.type == "like")
                        _add_to_like(valid);
                    else
                        _add_to_trash(valid);
                    //不能使用concat(),此函数返回一个新数组并不修改原数组
                    for (var i in valid)
                        list.push(valid[i]);
               }
            }
        }
    });

    var addToTrash = function(url) {
        chrome.extension.sendMessage({cmd: "query", type: "trash", trash: [url], simplify: 1});
    };

    var addToLike = function(url) {
        chrome.extension.sendMessage({cmd: "query", type: "like", like: [url], simplify: 1});
    };

    var addToKeys = function(keys) {
        var field = $(".keys-field");
        for (var index in keys) {
            var k = keys[index];
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

        _add_to_keys(keys);
    };

    var removeFromTrash = function(e) {
        var url = e.find("a").attr("href");
        trash.splice(trash.indexOf(url), 1);
        _remove_from_trash([url]);
        e.remove();
    };

    var removeFromLike = function(e) {
        var url = e.find("a").attr("href");
        like.splice(like.indexOf(url), 1);
        _remove_from_like([url]);
        e.remove();
    };

    var removeFromKeys = function(e) {
        var key = $.trim(e.text());
        keys.splice(keys.indexOf(key), 1);
        _remove_from_keys([key]);
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
            case "trash":
                if ($(this).hasClass("append")) {
                    if (input.length > 0) {
                        if (trash.indexOf(input) >= 0) {
                            alert("这个话题已经在垃圾箱里了。");
                        }
                        else if (like.indexOf(input) >= 0) {
                            var r = confirm("你以前收藏了这个话题，是否要把它从收藏夹里删除并扔进垃圾箱？");
                            if (r) {
                                like.splice(like.indexOf(input), 1);
                                _remove_from_like([input]);
                                $("#like table a[href='" + input + "']").parent().parent().remove();
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
                        _remove_from_trash(trash);
                        $("#trash table tr").remove();
                    }
                }
                break;
            case "like":
                if ($(this).hasClass("append")) {
                    if (input.length > 0) {
                        if (like.indexOf(input) >= 0) {
                            alert("这个话题已经在收藏夹里了。");
                        }
                        else if (trash.indexOf(input) >= 0) {
                            var r = confirm("你以前屏蔽了这个话题，是否要把它从垃圾箱里删除并加入收藏夹？");
                            if (r) {
                                trash.splice(trash.indexOf(input), 1);
                                _remove_from_trash([input]);
                                $("#trash table a[href='" + input + "']").parent().parent().remove();
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
                        _remove_from_like(like);
                        $("#like table tr").remove();
                    }
                }
                break;
            case "keys":
                if ($(this).hasClass("append")) {
                    if (input.length > 0) {
                        var input = input.split(/\s+/);
                        for (var i in input) {
                            if (keys.indexOf(input[i]) >= 0) {
                               input.splice(i, 1); 
                            }
                        }
                        addToKeys(input);
                    }
                }
                if ($(this).hasClass("clear")) {
                    var r = confirm("你确认要清空屏蔽关键词列表吗？");
                    if (r) {
                        _remove_from_keys(keys);
                        $(".keys-field").empty(); 
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
            case "extend":
                _set_extend(val);
                extend= val;
                break;
            default:
                break;
        }
    });

    chrome.extension.sendMessage({cmd: "all"}, function(data) {
        extend = data.extend;
        autoclear = data.autoclear;
        like = data.like;
        trash = data.trash;
        keys = data.keys;

        chrome.extension.sendMessage({cmd: "query", type: "like", like: like, simplify: 1});
        chrome.extension.sendMessage({cmd: "query", type: "trash", trash: trash, simplify: 1});

        var field = $(".keys-field");
        for (var index in keys) {
            var k = keys[index];
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

        if (extend)
            $(":checkbox[name='extend']").attr("checked", true);

        if (autoclear)
            $(":checkbox[name='autoclear']").attr("checked", true);
    });
});
