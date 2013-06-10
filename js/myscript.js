$(document).ready(function(){
    var booturl = chrome.extension.getURL("css/bootstrap.customized.css");

    var heart = "<i class='icon-heart'></i>";
    var redheart = "<i class='icon-redheart'></i>";
    var trash = "<i class='icon-trash'></i>";

	var _add_to_trash = function(url, topic) {
        chrome.extension.sendMessage({
            cmd: "append", 
            type: "del", 
            del_url: url, 
            del_topic: topic
        });
	};
	
	var _top = function(e) {
        e.addClass("info like");
        if (extend)
            e.css("display", "table-row");
        else
            e.css("display", "none");
		$("tr.pl:first").after(e);
    };
	
	var _add_to_top = function(url, topic) {
        chrome.extension.sendMessage({
            cmd: "append",
            type: "top",
            top_url: url,
            top_topic: topic
        });
	};

    var _remove_from_top = function(url, topic) {
        chrome.extension.sendMessage({
            cmd: "remove",
            type: "top",
            top_url: url,
            top_topic: topic
        });
    };

    var _remove_from_del = function(url, topic) {
        chrome.extension.sendMessage({
            cmd: "remove",
            type: "del",
            del_url: url,
            del_topic: topic
        });
    };

    var addToTrash = function(e) {
        var url = e.find("td.td-subject a").attr("href");
        var topic = e.find("td.td-subject a").attr("title");
        local.del_url.push(url);
        local.del_topic.push(topic);
        _add_to_trash([url], [topic]);
        e.remove();
    };

    var addToTop = function(e) {
        var url = e.find("td.td-subject a").attr("href");
        var topic = e.find("td.td-subject a").attr("title");
        local.top_url.push(url);
        local.top_topic.push(topic);
        _add_to_top([url], [topic]);
        var i = e.find("td.td-subject i");
        i.removeClass("icon-heart");
        i.addClass("icon-redheart");
        _top(e);
    };

    var removeFromTop = function(e) {
        var url = e.find("td.td-subject a").attr("href");
        var topic = e.find("td.td-subject a").text();
        debugger;
        var i = local.top_url.indexOf(url);
        local.top_url.splice(i, 1);
        i = local.top_topic.initTop(topic);
        local.top_topic.splice(i, 1);
        debugger;
        _remove_from_top([url], [topic]);
    }

    var initTop = function() {
        chrome.extension.sendMessage({cmd: "query", topic_url: local.top_url}, function(data) {
            var tr = "<tr class='pl'><td class='td-subject'></td><td class='td-reply' nowrap='nowrap'></td><td class='td-time'></td><td></td></tr>";
            for (index in data) {
                var info = data[index];
                if (!! info) {
                    var new_tr = $(tr); 
                    var a = $("<a></a>");
                    a.attr("href", info.url);
                    a.attr("title", info.topic);
                    a.text(info.topic);
                    new_tr.find(".td-subject").append(a);
                    a.before(redheart + " " + trash + " ");
                    new_tr.find(".td-reply").text(info.reply_num + "回应");
                    new_tr.find(".td-time").attr("title", info.last_reply);
                    new_tr.find(".td-time").text(info.last_reply_ex);
                    a = $("<a></a>");
                    a.attr("href", info.group_url);
                    a.text(info.group_name);
                    new_tr.find("td:last").append(a);
                    if (extend) 
                        new_tr.css("display", "table-row");
                    else
                        new_tr.css("display", "none");
                    _top(new_tr);
                }
                else {
                    debugger;
                    console.log("TOPIC INFO NOT FOUND");
                }
            }

            $("i.icon-trash").click(function() {
                var pp = $(this).parent().parent();
                debugger;
                if (pp.hasClass("like")) {
                    removeFromTop(pp);
                }
                addToTrash(pp);
            });

            $("i.icon-heart").click(function() {
                var pp = $(this).parent().parent();
                addToTop(pp);
            });
        });
    };
    
    var local = {};
    var extend = true;

    var init = function() {

        chrome.extension.sendMessage({cmd: "all"}, function(data) {
            local = data.list;
            extend = data.extend;

            $("table.olt").addClass("table table-hover");
            $("tr.pl:first").before("<tr class='pl control info'><td colspan='4'></td></tr>");
            var btn = "<div style='text-align:center'><style scope>";
            btn += "@import url('" + booturl + "');";
            btn += "</style>";
            if (extend)
                btn += "<i class='icon-chevron-up'></i></div>";
            else
                btn += "<i class='icon-chevron-down'></i></div>";
            $("tr.pl:first td:first").append(btn);

            $("tr.pl.control").click(function() {
                var i = $(this).find("i");
                if (i.hasClass("icon-chevron-up")) {
                    $("tr.pl.like").css("display", "none");
                    i.removeClass("icon-chevron-up");
                    i.addClass("icon-chevron-down");
                    extend = false;
                }
                else {
                    $("tr.pl.like").css("display", "table-row");
                    i.removeClass("icon-chevron-down");
                    i.addClass("icon-chevron-up");
                    extend = true;
                }
            });

            $(".head-nav").css("width", "690px");
            $(".head-nav").append("<button class='btn btn-link cog' style='color:#000000;float:right'><i class='icon-cog'></i>小组控</button>");

            initTop();

            $("td.td-subject a").each(function() {
                if (! $(this).parent().parent().hasClass("info")) {
                    href = $(this).attr("href");
                    if (local.del_url.indexOf(href) >= 0 || local.top_url.indexOf(href) >= 0)
                        $(this).parent().parent().remove();
                    else
                        $(this).before(heart + " " + trash + " ");
                }
            });
            
            $("button.cog").click(function() {
                chrome.extension.sendMessage({cmd: "clear"});
            });
        });
    };

    init();
});
