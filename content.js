let A = null;
$(() => { Load(null) })
function Load(res) { //載入頁面
  A = JSON.parse(localStorage.getItem("AutoVerify" + location.pathname));
  if (A == null) return "未設定任何參數";
  let elem = [];
  for (let i = 1; i <= 2; i++) {
    let e = A[i];
    if (e == null) return "參數未設定完全";
    let t = $(e.Tag);
    if (t == null || t.length == 0) return "找不到物件";
    t = t.get(t.length > 1 ? e.index : 0);
    if (t == null) return "找不到物件";
    elem.push(t);
  }
  img2txt(elem[0], A[0], elem[1], res);
}

let Mode = 0;
function SetAutoVerify(Type) {
  $(":visible").on("click", function () { set(this) }); //在元素上貼標籤
  Mode = Type;
}

function set(sender) {  //按下元素
  if (!Mode) return;
  let elem = $(sender);
  let Info = {
    Tag: elem.prop("tagName"),
    index: -1
  }
  let i = 0;
  $(Info.Tag + ":visible").each(function () {
    if (this == elem.get(0)) { Info.index = i; return; }
    i++;
  })

  if (elem.attr("id") != null)
    Info.Tag = "#" + elem.attr("id");
  else if (elem.attr("name") != null)
    Info.Tag = "[name='" + elem.attr("name") + "']";
  else if (Info.Tag == null || Info.index == -1)
    return;
  console.log(Info);
  if (A == null) A = [1, null, null];
  A[Mode] = Info;
  localStorage.setItem("AutoVerify" + location.pathname, JSON.stringify(A));
  Mode = 0;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let i = 0;
  let res = null;
  switch (request.info) {
    case 5: //測試
      console.log(sendResponse);
      if ((res = Load(sendResponse)) != null)
        alert(res);
      break;

    case 4: //模式B
      i = 1;
    case 3: //模式A
      if (A == null) A = [1, null, null];
      A[0] = i + 1;
      localStorage.setItem("AutoVerify" + location.pathname, JSON.stringify(A));
      console.log(A);
      break;

    case 2: //設定輸入框
      i = 1;
    // SetAutoVerify(1);
    // break;
    case 1: //設定驗證碼
      // SetAutoVerify(2);
      $(":visible").on("click", function () { set(this) }); //在元素上貼標籤
      Mode = i + 1;
      break;

    case 0: //點開
      res = {};
      if (A != null) res.engine = A[0] == 1 ? "A模式" : "B模式";
      if (A[1] != null) res.img = "更換驗證碼圖片(已設定)";
      if (A[2] != null) res.box = "更換回答輸入框(已設定)";
      sendResponse(res);
      break;

    default:
      console.log(request.info)
      // sendResponse('我收到了你的情书，popup~');
      break;
  }
})

function img2txt(img, engine, elem, res) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  let b64img = canvas.toDataURL('image/jpeg');
  if (res != null) res(b64img);
  console.log(b64img);
  $.ajax({
    "url": "https://api.ocr.space/parse/image",
    "method": "POST",
    "timeout": 0,
    "headers": {
      // "apikey": "helloworld",
      "apikey": "512d313bc588957",
      "Content-Type": "application/x-www-form-urlencoded"
    }, "data": {
      "scale": true,
      "detectOrientation": true,
      "language": "eng",
      "OCREngine": engine,
      "base64image": b64img
    }
  }).done(r => {
    if (r.OCRExitCode == 1) {
      if (res != null) alert("辨識結果：『" + r.ParsedResults[0].ParsedText + "』");
      console.log(r.ParsedResults[0].ParsedText);
      $(elem).val(r.ParsedResults[0].ParsedText);
    }
    else {
      if (res != null) alert("辨識失敗\n錯誤訊息：" + r.ErrorMessage);
      console.log(r);
    }
  });
}