$(document).ready(function(){
    var CONFIG_MANAGER = new ConfigManager();

    var icon_heart = "<i class='icon-heart' title='收藏'></i>";
    var icon_rheart = "<i class='icon-rheart' title='取消收藏'></i>";
    var icon_trash = "<i class='icon-trash' title='屏蔽'></i>";
    var icon_chevron_up = "<i class='icon-chevron-up'></i>";
    var icon_chevron_down = "<i class='icon-chevron-down'></i>";

    var extend = 0;

    chrome.extension.onMessage.addListener(function(response, sender) {
        if (sender.tab) {
            if (sender.tab.url.indexOf("background")) {
                switch (response.type) {
                    case "all":
                        init(response.data);
                        break;
                    case "query":
                        refresh(response.data);
                        break;
                    default:
                        if (debuger) {
                            console.log(response.type);
                        }
                        break;
                }
            }
        }
    });

    var refresh = function(data) {
        var tr = "<tr class='pl'><td class='td-subject'></td>";
        tr += "<td class='td-reply' nowrap='nowrap'></td>";
        tr += "<td class='td-time'></td><td></td></tr>";

        for (var index in data) {
            var topicObj = data[index];
            var new_tr = $(tr); 
            var a = $("<a></a>");

            a.attr("href", topicObj.url);
            a.attr("title", topicObj.title);
            a.text(topicObj.topic);

            if (! (topicObj instanceof ErrorTopic)) {
                new_tr.find(".td-subject").append(a);
                a.before(icon_rheart + " " + icon_trash + " ");
                new_tr.find(".td-reply").text(topicObj.replyNumber+ "回应");
                new_tr.find(".td-time").attr("title", topicObj.lastReplyTime);
                new_tr.find(".td-time").text(topicObj.formatLastReplyTime);
                a = $("<a></a>");
                a.attr("href", topicObj.groupUrl);
                a.text(trunc(topicObj.groupName, 12));
                new_tr.find("td:last").append(a);
            }

            new_tr.css("display", (extend ? "table-row" : "none"));
            _top(new_tr);
        }
        
        var btn = $("img.loadgif").parent();
        $("img.loadgif").remove();
        btn.append((extend ? icon_chevron_down : icon_chevron_up));

        $("i.icon-trash").click(function() {
            var pp = $(this).parent().parent();
            if (pp.hasClass("like")) {
                removeFromLike(pp);
            }
            addToTrash(pp);
        });

        $("i.icon-heart").click(function() {
            var pp = $(this).parent().parent();
            addToLike(pp);
        });

        $("i.icon-rheart").click(function() {
            var pp = $(this).parent().parent();
            removeFromLike(pp);
            pp.remove();
        });
    };
    
    function init(data) {
        CONFIG_MANAGER.init(data);
        extend = CONFIG_MANAGER.autoextend.data;

        var booturl = chrome.extension.getURL("css/bootstrap.customized.css");
        var loading = chrome.extension.getURL("img/loading.gif");

        $("table.olt").addClass("table table-hover");
        $("tr.pl:first").before("<tr class='pl control info'><td colspan='4'></td></tr>");

        var btn = "<div style='text-align:center'><style scope>";
        btn += "@import url('" + booturl + "');";
        btn += "</style>";
        btn += "<img class='loadgif' src='" + loading + "' />";
        $("tr.pl:first td:first").append(btn);

        var cog = $("<button></button>");
        cog.addClass("btn btn-link cog");
        cog.css("color", "#000000");
        cog.css("float", "right");
        cog.html("<i class='icon-cog'></i>小组控");
        $(".head-nav").css("width", "690px");
        $(".head-nav").append(cog);

        _top = function(e) {
            e.addClass("info like");
            e.css("display", (extend ? "table-row" : "none"));
            $("tr.pl:first").after(e);
        };
        
        addToBlaclist = function(e) {
            var url = e.find("td.td-subject a").attr("href");
            CONFIG_MANAGER.blacklist.append([url]);
            e.remove();
        };

        addToFavorites = function(e) {
            var url = e.find("td.td-subject a").attr("href");
            CONFIG_MANAGER.favorites.append([url]);
            var i = e.find("td.td-subject i.icon-heart");
            i.removeClass("icon-heart");
            i.addClass("icon-rheart");

            $("i.icon-rheart").click(function() {
                var pp = $(this).parent().parent();
                removeFromFavorites(pp);
                pp.remove();
            });

            _top(e);
        };

        removeFromFavorites = function(e) {
            var url = e.find("td.td-subject a").attr("href");
            CONFIG_MANAGER.favorites.remove([url]);
        };

        $("tr.pl.control").click(function() {
            var i = $(this).find("i");
            if (i.hasClass("icon-chevron-up")) {
                $("tr.pl.like").css("display", "none");
                i.removeClass("icon-chevron-up");
                i.addClass("icon-chevron-down");
                extend = 0;
            }
            else {
                $("tr.pl.like").css("display", "table-row");
                i.removeClass("icon-chevron-down");
                i.addClass("icon-chevron-up");
                extend = 1;
            }
        });

        $("td.td-subject a").each(function() {
            if (! $(this).parent().parent().hasClass("info")) {
                var href = $(this).attr("href");
                var title = $(this).attr("title");
                var favorites = CONFIG_MANAGER.favorites.data;
                var blacklist = CONFIG_MANAGER.blacklist.data;
                var keywords = CONFIG_MANAGER.keywords.data;

                if (blacklist.indexOf(href) >= 0 || favorites.indexOf(href) >= 0) {
                    $(this).parent().parent().remove();
                    //skip to next
                    return true;
                }
                else {                    
                    for (var i in keywords) {
                        if (title.indexOf(keywords[i]) >= 0) {
                            $(this).parent().parent().remove();
                            //skip to next
                            return true;
                        }
                    }
                    $(this).before(icon_heart + " " + icon_trash + " ");
                }
            }
        });

        chrome.extension.sendMessage(new QueryMessage("favorites", CONFIG_MANAGER.favorites.data));
    }

    init();
});