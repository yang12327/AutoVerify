$(() => { //點開插件
  send('open');
});

$("[engine]").on('click', function () { //切換引擎
  let mode = $(this).text().substr(0, 1);
  $("#engine").text(mode + "模式");
  $("[for=Ca]").css('text-decoration', mode != 'C' ? 'line-through' : 'none');
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
  $('#TestResult').html('<div class="d-flex justify-content-center"><div class="spinner-border text-success" role="status"><span class="visually-hidden">正在辨識……</span></div></div>');
  $('#TestError').html('');
  send('test');
})

$('#clear').on('click', () => { //清除
  for (let i = 1; i <= 3; i++) {
    send('setting', i, null);
    $("[index=" + i + "]").text("❌");
  }
  $("[for=W]").css('text-decoration', 'line-through');
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
        case 'open':  //點開插件
          let i = ['A', 'B', 'C', 'D'];
          $("#engine").text(i[res[0] - 1] + "模式");
          for (i = 1; i <= 3; i++) {
            $("[index=" + i + "]").text(res[i] == null ? "❌" : "✔️");
          }
          for (i = 4; i <= 8; i++)
            $("[index=" + i + "]").prop('checked', res[i]);
          $("#word").val(res[9]);
          $("[for=Ca]").css('text-decoration', res[0] != 3 ? 'line-through' : 'none');
          $("[for=W]").css('text-decoration', res[3] == null ? 'line-through' : 'none');
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