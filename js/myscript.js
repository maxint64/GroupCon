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
	
	var add_to_del = function() {
        chrome.extension.sendMessage({
            cmd: "append", 
            type: "del", 
            del_url: local.del_url, 
            del_topic: local.del_topic
        });
	}
	
	var top_ = function(e) {
        e.addClass("info");
		$("tr.pl:first").after(e);
    }
	
	var add_to_top = function(e) {
        chrome.extension.sendMessage({
            cmd: "append",
            type: "top",
            top_url: local.top_url,
            top_topic: local.top_topic
        });
	}

    var initTop = function() {
        var tr = "<tr class='pl'><td class='td-subject'></td><td class='td-reply' nowrap='nowrap'></td><td class='td-time'></td><td></td></tr>";
        var len = local.top_url.length;
        for (i = 0; i < len; i++ ) {
            chrome.extension.sendMessage({cmd: "query", topic_url: local.top_url[i]}, function(info) {
                if (!! info) {
                    var new_tr = $(tr); 
                    var a = $("a");
                    a.attr("href", local.top_url[i]);
                    a.attr("title", local.top_topic[i]);
                    a.text(local.top_topic[i]);
                    new_tr.find(".td-subject").append(a);
                    new_tr.find(".td-reply").append(info.reply_num + "回应");
                    new_tr.find(".td-time").attr("title", info.last_reply);
                    new_tr.find(".td-time").text(info.last_reply_ex);
                    a = $("a");
                    a.attr("href", info.group_url);
                    a.text(info.group_name);
                    new_tr.find("td:last").append(a);
                    console.log(new_tr.html());
                    debugger;
                    top_(new_tr);
                }
                else {
                    console.log("TOPIC INFO NOT FOUND");
                }
            });
        }
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

            $("td.td-subject a").each(function() {
                $(this).before("<input name='trashes' type='checkbox' /> ");
            });
        });

        $(".dropdown-menu li a").click(function() {
            select($(this).attr("tabindex"));
        });
        
        $("button#del").click(function() {
            $(":checked[name='trashes']").each(function() {
                local.del_url.push($(this).next("a").attr("href"));
                local.del_topic.push($(this).next("a").attr("title"));
                $(this).parent().parent().remove();
            });
            add_to_del();
        });
        
        $("button#top").click(function() {
            $($(":checked[name='trashes']").get().reverse()).each(function() {
                local.top_url.push($(this).next("a").attr("href"));
                local.top_topic.push($(this).next("a").attr("title"));
                top_($(this).parent().parent());
                $(this).removeAttr("checked");
            });
            add_to_top();
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
