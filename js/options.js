$(document).ready(function() {
    var extend = true;
    var like = [];
    var trash = [];

    var addToTrash = function(url) {
        chrome.extension.sendMessage({cmd: "query", type: "trash", trash: [url]}, function(data) {
            debugger;
            var table = $("#trash table");
            for (var index in data) {
                var info = data[index];
                if (!! info) {
                    var a = $("<a></a>");
                    a.attr("href", info.url); 
                    a.text(info.title);
                    var tr = $("<tr><td></td></tr>");
                    tr.find("td").append(a);
                    tr.find("td").append("<i class='icon-remove'></i>");
                    table.append(tr);
                }
            }
        });
        _add_to_trash([url]);
        trash.push(url);
    };

    var addToLike = function(url) {
        chrome.extension.sendMessage({cmd: "query", type: "like", like: [url]}, function(data) {
            debugger; 
            var table = $("#like table");
            for (var index in data) {
                var info = data[index];
                if (!! info) {
                    var a = $("<a></a>");
                    a.attr("href", info.url); 
                    a.text(info.title);
                    var tr = $("<tr><td></td></tr>");
                    tr.find("td").append(a);
                    tr.find("td").append("<i class='icon-remove'></i>");
                    table.append(tr);
                }
            }
        });
        _add_to_like([url]);
        like.push(url);
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

    $(".nav-tabs a").click(function(e) {
        e.preventDefault();
        $(this).tab("show");
    });


    $("button").click(function () {
        var ppp = $(this).parent().parent().parent();
        var url = $.trim(ppp.find("input").val());

        switch (ppp.attr("id")) {
            case "trash":
                if ($(this).hasClass("append")) {
                    if (url.length > 0) {
                        if (trash.indexOf(url) >= 0) {
                            alert("这个话题已经在垃圾箱里了。");
                        }
                        else if (like.indexOf(url) >= 0) {
                            var r = confirm("你以前收藏了这个话题，是否要把它从收藏夹里删除并扔进垃圾箱？");
                            if (r) {
                                like.splice(like.indexOf(url), 1);
                                _remove_from_like([url]);
                                $("#like table a[href='" + url + "']").parent().parent().remove();
                                addToTrash(url);
                            }
                        }
                        else {
                           addToTrash(url); 
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
                    if (url.length > 0) {
                        if (like.indexOf(url) >= 0) {
                            alert("这个话题已经在收藏夹里了。");
                        }
                        else if (trash.indexOf(url) >= 0) {
                            var r = confirm("你以前屏蔽了这个话题，是否要把它从垃圾箱里删除并加入收藏夹？");
                            if (r) {
                                trash.splice(trash.indexOf(url), 1);
                                _remove_from_trash([url]);
                                $("#trash table a[href='" + url + "']").parent().parent().remove();
                                addToLike(url);
                            }
                        }
                        else {
                           addToTrash(url); 
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
            case "key":
                break;
            default:
                break;
        }
    });

    chrome.extension.sendMessage({cmd: "all"}, function(data) {
        extend = data.extend;
        like = data.like;
        trash = data.trash;

        var len = trash.length;
        if (len > 0) {
            chrome.extension.sendMessage({cmd: "query", type: "trash", trash: trash}, function(data) {
                var table = $("#trash table");
                for (var index in data) {
                    var info = data[index];
                    if (!! info) {
                        var a = $("<a></a>");
                        a.attr("href", info.url); 
                        a.text(info.title);
                        var tr = $("<tr><td></td></tr>");
                        tr.find("td").append(a);
                        tr.find("td").append("<i class='icon-remove'></i>");
                        table.append(tr);
                    }
                }

                $("#trash .icon-remove").click(function() {
                    removeFromTrash($(this).parent().parent());
                });
            });
        }

        len = like.length;
        if (len > 0) {
            chrome.extension.sendMessage({cmd: "query", type: "like", like: like}, function(data) {
                var table = $("#like table");
                for (var index in data) {
                    var info = data[index];
                    if (!! info) {
                        var a = $("<a></a>");
                        a.attr("href", info.url); 
                        a.text(info.title);
                        var tr = $("<tr><td></td></tr>");
                        tr.find("td").append(a);
                        tr.find("td").append("<i class='icon-remove'></i>");
                        table.append(tr);
                    }
                }

                $("#like .icon-remove").click(function() {
                    removeFromLike($(this).parent().parent());
                });
            });
        }
    });
});
