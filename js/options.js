$(document).ready(function() {
    var local = {};
    var extend = false;

    $(".nav-tabs a").click(function(e) {
        e.preventDefault();
        $(this).tab("show");
    });

    chrome.extension.sendMessage({cmd: "all"}, function(data) {
        local = data.list;
        extend = data.extend;

        debugger;
        var len = local.del_url.length;
        if (len > 0) {
            $("#trashfield").append("<table class='table'></table>");
            for (var i = 0; i < len; i++) {
                var a = $("<a></a>");
                a.attr("href", local.del_url[i]);
                a.attr("title", local.del_topic[i]);
                a.text(local.del_topic[i]);
                var tr = $("<tr><td></td></tr>");
            }
        }

        len = local.top_url.length;
        for (var i = 0; i < len; i++) {
            $("#top tbody").append("<tr><td>" + local.top_topic[i] + "</td><td>" + local.top_url[i] + "</td></tr>");
        }
    });
});
