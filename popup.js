$(() => { //點開插件
  send('open');
});

$("[engine]").on('click', function () { //切換引擎
  $("#engine").text($(this).text().substr(0, 1) + "模式");
  send('setting', 0, parseInt($(this).attr("engine")));
});

$("input[type=checkbox]").change(function () {  //切換開關
  send('setting', parseInt($(this).attr("index")), $(this).prop("checked"));
});

$("#word").change(function () { //調整字數
  send('setting', 9, $(this).val());
  $("[index=8]").prop("checked", true).change();
});

$('#testBtn').on('click', () => {  //測試
  send('test');
})

$('#clear').on('click', () => {
  send('setting', 1, null);
  send('setting', 2, null);
  send('setting', 3, null);
})

function send(Info, index, value) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, (tabs) => {
    let message = { info: Info, index: index, value: value };
    chrome.tabs.sendMessage(tabs[0].id, message, res => {
      if (res == null) return;
      switch (message.info) {
        case 'open':
          let i = ['A', 'B', 'C'];
          $("#engine").text(i[res[0] - 1] + "模式");
          for (i = 1; i <= 3; i++) {
            $("[index=" + i + "]").text(res[i] == null ? "❌" : "✔️");
          }
          for (i = 4; i <= 8; i++)
            $("[index=" + i + "]").prop('checked', res[i]);
          $("#word").val(res[9]);
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
    case 'test':
      if (request.img != null) $("#TestImg").attr("src", request.img);
      if (request.text != null) $("#TestResult").text("辨識結果：『" + request.text + "』");
      if (request.err != null) {
        $("#TestError").text("辨識失敗：" + request.err);
        $("#TestResult").text("");
      }
      break;

    default:
      request.from = sender.tab ? "content >" + sender.tab.url : "background"
      console.log(request);
      break;
  }
  sendResponse(null);
});