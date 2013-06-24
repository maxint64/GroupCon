$(document).ready(function(){
    var booturl = chrome.extension.getURL("css/bootstrap.customized.css");
    var loading = chrome.extension.getURL("img/loading.gif");

    var icon_heart = "<i class='icon-heart' title='收藏'></i>";
    var icon_rheart = "<i class='icon-rheart' title='取消收藏'></i>";
    var icon_trash = "<i class='icon-trash' title='删除'></i>";

    var trunc = function(str, len) {
        return (str.length > len) ? str.substr(0, len) + "..." : str;
    }

	var _top = function(e) {
        e.addClass("info like");
        if (extend) 
            e.css("display", "table-row");
        else 
            e.css("display", "none");
		$("tr.pl:first").after(e);
    };
	
    var addToTrash = function(e) {
        var url = e.find("td.td-subject a").attr("href");
        _add_to_trash([url]);
        e.remove();
    };

    var addToLike = function(e) {
        var url = e.find("td.td-subject a").attr("href");
        _add_to_like([url]);
        var i = e.find("td.td-subject i.icon-heart");
        i.removeClass("icon-heart");
        i.addClass("icon-rheart");

        $("i.icon-rheart").click(function() {
            var pp = $(this).parent().parent();
            removeFromLike(pp);
            pp.remove();
        });

        _top(e);
    };

    var removeFromLike = function(e) {
        var url = e.find("td.td-subject a").attr("href");
        _remove_from_like([url]);
    }

    chrome.extension.onMessage.addListener(function(msg, sender) {
        if (sender.tab) {
            if (sender.tab.url.indexOf("background") && msg.target == "myscript") {
                var tr = "<tr class='pl'><td class='td-subject'></td>";
                tr += "<td class='td-reply' nowrap='nowrap'></td>";
                tr += "<td class='td-time'></td><td></td></tr>";

                for (var index in msg.result) {
                    var info = msg.result[index];
                    if (! info.err) {
                        //debugger;
                        var new_tr = $(tr); 
                        var a = $("<a></a>");
                        a.attr("href", info.url);
                        a.attr("title", info.title);
                        a.text(info.topic);
                        new_tr.find(".td-subject").append(a);
                        a.before(icon_rheart + " " + icon_trash + " ");
                        new_tr.find(".td-reply").text(info.reply_num + "回应");
                        new_tr.find(".td-time").attr("title", info.last_reply);
                        new_tr.find(".td-time").text(info.last_reply_ex);
                        a = $("<a></a>");
                        a.attr("href", info.group_url);
                        a.text(trunc(info.group_name, 12));
                        new_tr.find("td:last").append(a);
                        if (extend) 
                            new_tr.css("display", "table-row");
                        else
                            new_tr.css("display", "none");
                        _top(new_tr);
                    }
                    else {
                        //debugger;
                        console.log("TOPIC INFO NOT FOUND");
                    }
                }
                
                var btn = $("img.loadgif").parent();
                $("img.loadgif").remove();
                if (extend)
                    btn.append("<i class='icon-chevron-up'></i>");
                else
                    btn.append("<i class='icon-chevron-down'></i>");

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
            }
        }
    });

    var like = [];
    var trash = []; 
    var extend = 1;

    var init = function() {
        chrome.extension.sendMessage({cmd: "all"}, function(data) {
            like = data.like;
            trash = data.trash;
            keys = data.keys;
            extend = data.extend;

            //debugger;
            $("table.olt").addClass("table table-hover");
            $("tr.pl:first").before("<tr class='pl control info'><td colspan='4'></td></tr>");
            var btn = "<div style='text-align:center'><style scope>";
            btn += "@import url('" + booturl + "');";
            btn += "</style>";
            btn += "<img class='loadgif' src='" + loading + "' />";
            $("tr.pl:first td:first").append(btn);

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

            var cog = $("<button></button>");
            cog.addClass("btn btn-link cog");
            cog.css("color", "#000000");
            cog.css("float", "right");
            cog.html("<i class='icon-cog'></i>小组控");
            $(".head-nav").css("width", "690px");
            $(".head-nav").append(cog);

            $("td.td-subject a").each(function() {
                if (! $(this).parent().parent().hasClass("info")) {
                    var href = $(this).attr("href");
                    var title = $(this).attr("title");

                    if (trash.indexOf(href) >= 0 || like.indexOf(href) >= 0) {
                        $(this).parent().parent().remove();
                        //skip to next
                        return true;
                    }
                    else {                    
                        for (var i in keys) {
                            if (title.indexOf(keys[i]) >= 0) {
                                $(this).parent().parent().remove();
                                //skip to next
                                return true;
                            }
                        }
                        $(this).before(icon_heart + " " + icon_trash + " ");
                    }
                }
            });
            
            $("button.cog").click(function() {
                window.open(chrome.extension.getURL("html/options.html"));
            });

            chrome.extension.sendMessage({cmd: "query", type: "like", like: like, simplify: 0});
        });
    };

    init();
});
