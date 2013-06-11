$(document).ready(function() {
    var extend = true;
    var like = [];
    var trash = [];

    $(".nav-tabs a").click(function(e) {
        e.preventDefault();
        $(this).tab("show");
    });

    $("button").click(function () {
        var ppp = $(this).parent().parent().parent();
        var url = $.trim(ppp.find("input").text());

        switch (ppp.attr("id")) {
            case "trash":
                if ($(this).hasClass("append")) {
                    if (url.length > 0) {
                        _add_to_trash(url);
                    }
                }
                if ($(this).hasClass("clear")) {
                }
                break;
            case "like":
                if ($(this).hasClass("append")) {
                    if (url.length > 0) {
                        _add_to_like(url);
                    }
                }
                if ($(this).hasClass("clear")) {
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
                    var a = $("<a></a>");
                    a.attr("href", info.url); 
                    a.text(info.title);
                    var tr = $("<tr><td></td></tr>");
                    tr.find("td").append(a);
                    tr.find("td").append("<i class='icon-remove'></i>");
                    table.append(tr);
                }
            });
        }

        len = like.length;
        if (len > 0) {
            chrome.extension.sendMessage({cmd: "query", type: "like", like: like}, function(data) {
                var table = $("#like table");
                for (var index in data) {
                    var info = data[index];
                    var a = $("<a></a>");
                    a.attr("href", info.url); 
                    a.text(info.title);
                    var tr = $("<tr><td></td></tr>");
                    tr.find("td").append(a);
                    tr.find("td").append("<i class='icon-remove'></i>");
                    table.append(tr);
                }
            });
        }
    });
});
