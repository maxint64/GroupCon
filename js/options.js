$(document).ready(function() {
    var extend = true;
    var like = [];
    var trash = [];
    var keys = [];
    var icon_remove = "<i class='icon-remove' title='删除'></i>"; 

    var addToTrash = function(url) {
        chrome.extension.sendMessage({cmd: "query", type: "trash", trash: [url], simplify: 1}, function(data) {
            //debugger;
            var table = $("#trash table");
            for (var index in data) {
                var info = data[index];
                var a = $("<a></a>");
                a.attr("href", info.url); 
                if (! info.err)
                    a.text(info.title);
                else if (autoclear) {
                    alert("此话题不存在或已被删除");
                    return ;
                }
                else
                    a.text("【此话题不存在或已被删除】");
                var tr = $("<tr><td></td></tr>");
                tr.find("td").append(a);
                tr.find("td").append(icon_remove);
                table.append(tr);
            }

            $("#trash .icon-remove").click(function() {
                removeFromTrash($(this).parent().parent());
            });

            _add_to_trash([url]);
            trash.push(url);
        });
    };

    var addToLike = function(url) {
        chrome.extension.sendMessage({cmd: "query", type: "like", like: [url], simplify: 1}, function(data) {
            //debugger; 
            var table = $("#like table");
            for (var index in data) {
                var info = data[index];
                var a = $("<a></a>");
                a.attr("href", info.url); 
                if (! info.err)
                    a.text(info.title);
                else if (autoclear) {
                    alert("此话题不存在或已被删除");
                    return ;
                }
                else
                    a.text("【此话题不存在或已被删除】");
                var tr = $("<tr><td></td></tr>");
                tr.find("td").append(a);
                tr.find("td").append(icon_remove);
                table.append(tr);
            }

            $("#like .icon-remove").click(function() {
                removeFromLike($(this).parent().parent());
            });

            _add_to_like([url]);
            like.push(url);
        });
    };

    var addToKeys = function(keys) {
        var field = $(".keys-field");
        for (var index in keys) {
            var k = keys[index];
            var label = $("<span class='label' title='点击删除关键词'></span>");
            label.text(k);
            label.append(icon-remove);
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

        var len = trash.length;
        var garbage = [];
        if (len > 0) {
            chrome.extension.sendMessage({cmd: "query", type: "trash", trash: trash, simplify: 1}, function(data) {
                var table = $("#trash table");
                for (var index in data) {
                    var info = data[index];
                    var a = $("<a></a>");
                    a.attr("href", info.url); 
                    if (! info.err)
                        a.text(info.title);
                    else if (autoclear) {
                        garbage.push(info.url)
                        trash.splice(trash.indexOf(info.url), 1);
                        continue;
                    }
                    else
                        a.text("【此话题不存在或已被删除】");
                    var tr = $("<tr><td></td></tr>");
                    tr.find("td").append(a);
                    tr.find("td").append(icon_remove);
                    table.append(tr);
                }

                $("#trash .icon-remove").click(function() {
                    removeFromTrash($(this).parent().parent());
                });

                if (autoclear && garbage.length > 0)
                    _remove_from_trash(garbage);
            });
        }

        len = like.length;
        garbage = [];
        if (len > 0) {
            chrome.extension.sendMessage({cmd: "query", type: "like", like: like, simplify: 1}, function(data) {
                var table = $("#like table");
                for (var index in data) {
                    var info = data[index];
                    var a = $("<a></a>");
                    a.attr("href", info.url); 
                    if (! info.err)
                        a.text(info.title);
                    else if (autoclear) {
                        garbage.push(info.url);
                        like.splice(like.indexOf(info.url), 1);
                        continue;
                    }
                    else
                        a.text("【此话题不存在或已被删除】");
                    var tr = $("<tr><td></td></tr>");
                    tr.find("td").append(a);
                    tr.find("td").append(icon_remove);
                    table.append(tr);
                }

                $("#like .icon-remove").click(function() {
                    removeFromLike($(this).parent().parent());
                });

                if (autoclear && garbage.length > 0)
                    _remove_from_like(garbage);
            });
        }

        len = keys.length;
        if (len > 0) {
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
        }

        if (extend)
            $(":checkbox[name='extend']").attr("checked", true);

        if (autoclear)
            $(":checkbox[name='autoclear']").attr("checked", true);
    });
});
