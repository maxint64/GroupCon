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
        for (var i = 0; i < len; i++) {
            $("#del tbody").append("<tr><td>" + local.del_topic[i] + "</td><td>" + local.del_url[i] + "</td></tr>");
        }

        len = local.top_url.length;
        for (var i = 0; i < len; i++) {
            $("#top tbody").append("<tr><td>" + local.top_topic[i] + "</td><td>" + local.top_url[i] + "</td></tr>");
        }
    });
});
