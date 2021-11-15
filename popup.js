$(() => { //點開插件
  send(0);
});

$("[send]").on('click', function () {
  send(parseInt($(this).attr("send")));
});

$("[engine]").on('click', function () { //切換引擎
  $("#engine").text($(this).text().substr(0, 1) + "模式");
});

function send(Info) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, (tabs) => {
    let message = {
      info: Info
    }
    chrome.tabs.sendMessage(tabs[0].id, message, res => {
      if (res == null) return;
      switch (message.info) {
        case 0:
          if (res.engine != null)
            $("#engine").text(res.engine);
          if (res.img != null)
            $("[send=1]").text(res.img);
          if (res.box != null)
            $("[send=2]").text(res.box);
          break;

        case 5:
          $("#TestImg").attr("src", res);
          break;

        default:
          console.log('popup=>content', res);
          break;
      }
    })
  })
}
