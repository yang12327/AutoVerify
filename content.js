let A = null;
let errCount = 0;
$(() => {
  send({ info: 'load', url: location.host });
})
function Load() { //載入頁面
  if (A == null) return "未設定任何參數";
  let elem = [];
  for (let i = 1; i <= 2; i++) {
    let e = FindElem(i);
    if (e.obj == null) return e.err;
    elem.push(e.obj);
  }
  $(elem[1]).val("");
  setTimeout(() => {
    img2txt(elem[0], A[0], elem[1]);
  }, 100);
}

function FindElem(i) {
  let e = A[i];
  if (e == null) return { err: "參數未設定完全" };
  let t = $(e.Tag + ":visible");
  if (t == null || t.length == 0 ||
    (t = t.get(t.length > 1 ? e.index : 0)) == null)
    return { err: "找不到物件" };
  return { obj: t };
}

var selected = null;
document.addEventListener("contextmenu", (event) => {
  selected = event.target;
}, true);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let res = null;
  switch (request.info) {
    case 'menu':  //設定元素
      let elem = $(selected);
      if (request.index == 4) {   //辨識到剪貼簿
        img2txt(selected, 4, null);
        break;
      }
      let Info = {
        Tag: elem.prop("tagName"),
        index: -1
      }
      let i = 0;
      $(Info.Tag + ":visible").each(function () {
        if (this == elem.get(0)) {
          Info.index = i;
          return;
        }
        i++;
      })
      if (elem.attr("id") != null)
        Info.Tag = "#" + elem.attr("id");
      else if (elem.attr("name") != null)
        Info.Tag = "[name='" + elem.attr("name") + "']";
      else if (Info.Tag == null || Info.index == -1)
        break;
      if (request.index == 3)
        elem.on("click", Load);
      console.log(Info);
      request.value = Info;
    case 'setting': //修改設定
      A[request.index] = request.value;
      save();
      break;

    case 'test': //測試
      errCount = 0;
      if ((res = Load()) != null)
        send({ info: 'test', err: res });
      break;

    case 'open': //點開插件
      return sendResponse(A);

    case 'load':  //載入頁面
      A = request.data[location.host];
      if (A == null) A = [4, null, null, null, true, true, true, false, false, 4];
      Load();
      if (A[3] != null) {
        let t = FindElem(3).obj;
        if (t != null)
          $(t).on("click", Load);
      }
      break;

    default:
      console.log(request);
      break;
  }
  sendResponse(null);
});

function send(message) {
  chrome.runtime.sendMessage(message, res => {
    if (res != null) console.log(res);
  });
}

function save() {
  let data = {};
  data[location.host] = A;
  send({ info: 'save', data: data });
}

function img2txt(img, engine, elem) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  let b64img = canvas.toDataURL('image/jpeg');
  send({ info: 'test', img: b64img });
  console.log(b64img);

  function response(r) {
    if (elem != null && $(elem).val().length > 0)
      return send({ info: 'test', err: '使用者中斷操作' });
    if (r.text != null) {
      if (elem == null) { //複製到剪貼簿
        var clip_area = document.createElement('textarea');
        clip_area.textContent = r.text;
        document.body.appendChild(clip_area);
        clip_area.select();
        document.execCommand('copy');
        clip_area.parentNode.removeChild(clip_area);
        alert("辨識結果「" + r.text + "」已複製到剪貼簿");
      }
      else {
        let OCR = Filter(r.text);
        send({ info: 'test', text: OCR });
        if (Fail(OCR)) return;
        errCount = 0; $(elem).val(OCR);
      }
    }
    else {
      send({ info: 'test', err: r.err });
      console.log(r);
      Fail("");
    }
  }
  switch (engine) {
    case 1:
    case 2:
      OCRspace(b64img, engine, response);
      break;
    case 3:
      AntiCaptcha(b64img, response);
      break;
    case 4:
      ddddOCR(b64img, response)
      break;
  }
}

function ddddOCR(b64img, response) {
  b64img = /.*base64,(.+)/.exec(b64img);
  if (b64img == null || b64img.length < 2)
    return response({ err: "圖片格式不正確" });
  $.ajax({
    "url": "https://api.zxcv.cx/ddddocr/api",
    "method": "POST",
    "timeout": 3000,
    "data": {
      "img": b64img[1]
    }
  }).always((r, st) => {
    if (st != "success")
      return response({ obj: r, err: r.responseText != null ? r.responseText : r.statusText });
    console.log(r);
    response(JSON.parse(r));
  });
}

function AntiCaptcha(b64img, response) {
  b64img = /.*base64,(.+)/.exec(b64img);
  if (b64img == null || b64img.length < 2)
    return response({ err: "圖片格式不正確" });
  let Up = A[4], Do = A[5], Di = A[6],
    Case = A[7], Length = A[8] ? A[9] : 0;
  $.ajax({
    "url": "https://api.anti-captcha.com/createTask",
    "method": "POST",
    "timeout": 5000,
    "headers": {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    "data": JSON.stringify({
      "clientKey": "86bd697e61173e3a930a8be54e0e19ae",
      "task": {
        "type": "ImageToTextTask",
        "body": b64img[1],
        "phrase": false,
        "case": Case,
        "numeric": !Di ? 2 : (!Up && !Do ? 1 : 0),
        "math": false,
        "minLength": Length,
        "maxLength": Length
      }
    })
  }).always((r, st) => {
    if (st != "success")
      return response({ obj: r, err: r.responseText != null ? r.responseText : r.statusText });
    if (r.errorId != 0)
      return response({ obj: r, err: r.errorDescription });
    function Check() {
      $.ajax({
        "url": "https://api.anti-captcha.com/getTaskResult",
        "method": "POST",
        "timeout": 10000,
        "headers": {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        "data": JSON.stringify({
          "clientKey": "86bd697e61173e3a930a8be54e0e19ae",
          "taskId": r.taskId
        })
      }).always((r2, st2) => {
        if (st2 != "success")
          return response({ obj: r2, err: r2.responseText != null ? r2.responseText : r2.statusText });
        if (r2.errorId != 0)
          return response({ obj: r2, err: r2.errorDescription });
        switch (r2.status) {
          case "processing":
            setTimeout(Check, 500);
            break;
          case "ready":
            response({ obj: r2, text: r2.solution.text });
            break;
        }
      });
    }
    Check();
  });
}

function OCRspace(b64img, engine, response) {
  $.ajax({
    "url": "https://api.ocr.space/parse/image",
    "method": "POST",
    "timeout": 5000,
    "headers": {
      // "apikey": "helloworld",
      "apikey": "512d313bc588957",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    "data": {
      "scale": true,
      "detectOrientation": true,
      "language": "eng",
      "OCREngine": engine,
      "base64image": b64img
    }
  }).always((r, st) => {
    if (st == "success") {
      if (r.OCRExitCode == 1)
        response({ obj: r, text: r.ParsedResults[0].ParsedText });
      else response({ obj: r, err: r.ErrorMessage });
    } else response({ obj: r, err: r.responseText != null ? r.responseText : r.statusText });
  });
}


function Fail(OCR) {
  if (++errCount < 5) {
    if (A[8]) { //有開啟篩選器
      let t = FindElem(3).obj;
      if (t != null && OCR.length != A[9]) {
        t.click();
        console.log("Retry(" + errCount + ")");
        return true;
      }
    }
    return false;
  } else {
    console.log("Retry(" + errCount + ") & Stop");
    return true;
  }
}

function Filter(text) {
  let OCR = text.match(/\w/g);
  if (OCR == null) return "";
  OCR = OCR.join("");
  let Up = A[4], Do = A[5], Di = A[6];
  if (!Up && Do)
    OCR = OCR.replaceAll("I", "l")
      .replaceAll('6', 'b')
      .replaceAll('9', 'q').toLowerCase();
  else if (Up && !Do)
    OCR = OCR.replaceAll("l", "I").toUpperCase();
  else if (!Up && !Do)
    OCR = OCR.replaceAll(/o/gi, "0")
      .replaceAll(/[lI]/g, "1")
      .replaceAll(/z/gi, "2")
      .replaceAll('b', '6')
      .replaceAll('q', '9');
  if (!Di) {
    OCR = OCR.replaceAll("0", "O").replaceAll("1", Up ? "I" : "l").replaceAll("2", "Z");
    if (!Up) OCR = OCR.toLowerCase();
  }
  OCR = OCR.match(new RegExp("[" + (Up ? "A-Z" : "") + (Do ? "a-z" : "") + (Di ? "0-9" : "") + "]", 'g'))
  if (OCR == null) return "";
  OCR = OCR.join("");
  console.log(text, "=>", OCR);
  return OCR;
}