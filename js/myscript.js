$(document).ready(function(){
    var booturl = chrome.extension.getURL("css/bootstrap.customized.css");

	var btn = "<div class='btn-group'>";
    btn += "<button class='btn btn-small'>选择</button>";
    btn += "<style scoped>";
    btn += "@import url('" + booturl + "');";
    btn += "</style>";
    btn += "<button class='btn btn-small dropdown-toggle' data-toggle='dropdown'>";
    btn += "<span class='caret'></span></button>";
	btn += "<ul class='dropdown-menu'>" 
	btn += "<li><a tabindex='0' href='#'>全选</a></li>";
	btn += "<li><a tabindex='1' href='#'>不选</a></li>";
	btn += "<li><a tabindex='2' href='#'>反选</a></li>";
    btn += "</ul>"
    btn += "</div>";

	btn += "<div class='btn-group'>";
	btn += "<button class='btn btn-small' id='del'><i class='icon-trash'></i> 删除</button>";
	btn += "<button class='btn btn-small' id='top'><i class='icon-arrow-up'></i> 置顶</button>";
	btn += "<button class='btn btn-small' id='cog'><i class='icon-cog'></i> 设置</button>";
	btn += "</div>";
	
	var select = function(arg) {
		switch(arg) {
			case 0:
				$(":checkbox[name='trashes']").attr("checked", "checked");
				break;
			case 1:
				$(":checkbox[name='trashes']").removeAttr("checked");
				break;
			case 2:
				$(":checkbox[name='trashes']").each(function() {
					if (!! $(this).attr("checked")) {
						$(this).removeAttr("checked");
					}
					else {
						$(this).attr("checked", "checked");
					}
				});
				break;
			default:
				break;
		}
	}
	
	var add_to_del = function(url, topic) {
        chrome.extension.sendMessage({
            cmd: "append", 
            type: "del", 
            del_url: url, 
            del_topic: topic
        });
	}
	
	var top_ = function(e) {
        e.addClass("info");
		$("tr.pl:first").after(e);
    }
	
	var add_to_top = function(url, topic) {
        chrome.extension.sendMessage({
            cmd: "append",
            type: "top",
            top_url: url,
            top_topic: topic
        });
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
                    a.before("<input name='trashes' type='checkbox' />");
                    new_tr.find(".td-reply").text(info.reply_num + "回应");
                    new_tr.find(".td-time").attr("title", info.last_reply);
                    new_tr.find(".td-time").text(info.last_reply_ex);
                    a = $("<a></a>");
                    a.attr("href", info.group_url);
                    a.text(info.group_name);
                    new_tr.find("td:last").append(a);
                    top_(new_tr);
                    debugger;
                }
                else {
                    console.log("TOPIC INFO NOT FOUND");
                }
            }
        });
    };

    var local = {};

    var init = function() {

        $("table.olt").addClass("table table-hover");
        $("tr.pl:first").before("<tr class='pl control'><td colspan='4'></td></tr>");
        $("tr.pl:first td:first").append(btn);

        chrome.extension.sendMessage({cmd: "all"}, function(data) {
            local = data;

            $($("td.td-subject a").get().reverse()).each(function() {
                href = $(this).attr("href");
                if (data.del_url.indexOf(href) >= 0 || data.top_url.indexOf(href) >= 0)
                    $(this).parent().parent().remove();
            });

            initTop();
        });

        $("td.td-subject a").each(function() {
            $(this).before("<input name='trashes' type='checkbox' /> ");
        });

        $(".dropdown-menu li a").click(function() {
            select($(this).attr("tabindex"));
        });
        
        $("button#del").click(function() {
            var tmp_url = [];
            var tmp_topic = [];
            $(":checked[name='trashes']").each(function() {
                var url = $(this).next("a").attr("href");
                var topic = $(this).next("a").attr("title");
                if (local.del_url.indexOf(url) < 0) {
                    local.del_url.push(url);
                    local.del_topic.push(topic);
                    tmp_url.push(url);
                    tmp_url.push(topic);
                }
                $(this).parent().parent().remove();
            });
            add_to_del(tmp_url, tmp_topic);
        });
        
        $("button#top").click(function() {
            var tmp_url = [];
            var tmp_topic = [];
            $($(":checked[name='trashes']").get().reverse()).each(function() {
                var url = $(this).next("a").attr("href");
                var topic = $(this).next("a").attr("title");
                if (local.top_url.indexOf(url) < 0) {
                    local.top_url.push(url);
                    local.top_topic.push(topic);
                    tmp_url.push(url);
                    tmp_topic.push(url);
                }
                top_($(this).parent().parent());
                $(this).removeAttr("checked");
            });
            add_to_top(tmp_url, tmp_topic);
        });
        
        $("button#cog").click(function() {
            //window.open(chrome.extension.getURL("html/options.html"));
            chrome.extension.sendMessage({cmd: "remove"});
            //chrome.extension.sendMessage({
            //    cmd: "query",
            //    topic_url: "http://www.douban.com/group/topic/14753859/",
            //},
            //function(data) {
            //    console.log(data);
            //});
        });
    };

    init();
});
