$(document).ready(function() {
    $(".nav-tabs a").click(function(e) {
        e.preventDefault();
        $(this).tab("show");
    });

    del_url = (!! localStorage.del_url) ? localStorage.del_topic.split(",") : [];
    del_topic = (!! localStorage.del_topic) ? localStorage.del_topic.split(",") : [];
    top_url = (!! localStorage.top_url) ? localStorage.top_url.split(",") : [];
    top_topic = (!! localStorage.top_topic) ? localStorage.top_topic.split(",") : [];

    len = del_url.length;
    for (i = 0; i < len; i++) {
        console.log(del_topic[i] + " " + del_url[i]);
        $("#del tbody").append("<tr><td>" + del_topic[i] + "</td><td>" + del_url[i] + "</td></tr>");
    }

    len = top_url.length;
    for (i = 0; i < len; i++) {
        console.log(i);
        $("top tbody").append("<tr><td>" + top_topic[i] + "</td><td>" + top_url[i] + "</td></tr>");
    }

});
