$(() => { //點開插件
  send(0);
});

$("[send]").on('click', function () {
  send(parseInt($(this).attr("send")));
});

$("[engine]").on('click', function () { //切換引擎
  $("#engine").text($(this).text().substr(0, 1) + "模式");
});

$("input[type=checkbox]").change(function () {
  send(6, { index: parseInt($(this).attr("index")), checked: $(this).prop("checked") });
});

$("#word").change(function () {
  send(6, { index: 7, checked: $(this).val() });
  $("[index=6]").prop("checked", true).change();
});

function send(Info, message = {}) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, (tabs) => {
    message.info = Info;
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
          if (res.ren != null)
            $("[send=8]").text(res.ren);
          $("#Up").prop("checked", res.filter[0]);
          $("#Do").prop("checked", res.filter[1]);
          $("#Di").prop("checked", res.filter[2]);
          $("#W").prop("checked", res.filter[3]);
          $("#word").val(res.word);
          break;

        default:
          console.log('popup=>content', res);
          break;
      }
    })
  })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.info) {
    case 5:
      if (request.img != null) $("#TestImg").attr("src", request.img);
      if (request.text != null) $("#TestResult").text("辨識結果：『" + request.text + "』");
      if (request.err != null) $("#TestError").text("辨識失敗：" + request.err);
      break;

    default:
      request.from = sender.tab ? "content >" + sender.tab.url : "background"
      sendResponse(request);
      break;
  }
  sendResponse();
});