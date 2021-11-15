let A = null;
$(() => { Load() })
function Load() { //載入頁面
  A = JSON.parse(localStorage.getItem("AutoVerify" + location.pathname));
  if (A == null) return "未設定任何參數";
  let elem = [];
  for (let i = 1; i <= 2; i++) {
    let e = FindElem(i);
    if (e.obj == null) return e.err;
    elem.push(e.obj);
  }
  img2txt(elem[0], A[0], elem[1]);
  if (A[8] != null) {
    let t = FindElem(8).obj;
    if (t != null)
      $(t).on("click", () => {
        setTimeout(Load, 200);
      });
  }
}

function FindElem(i) {
  let e = A[i];
  if (e == null) return { err: "參數未設定完全" };
  let t = $(e.Tag);
  if (t == null || t.length == 0) return { err: "找不到物件" };
  t = t.get(t.length > 1 ? e.index : 0);
  if (t == null) return { err: "找不到物件" };
  return { obj: t };
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
  if (A == null) A = [1];
  A[Mode] = Info;
  localStorage.setItem("AutoVerify" + location.pathname, JSON.stringify(A));
  Mode = 0;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let i = 0;
  let res = null;
  switch (request.info) {
    case 6: //篩選器
      console.log(request);
      if (request.index != null && request.checked != null) {
        A[request.index] = request.checked;
        localStorage.setItem("AutoVerify" + location.pathname, JSON.stringify(A));
      }
      break;

    case 5: //測試
      console.log(sendResponse);
      if ((res = Load(sendResponse)) != null)
        alert(res);
      break;

    case 4: //模式B
      i = 1;
    case 3: //模式A
      if (A == null) A = [];
      A[0] = i + 1;
      localStorage.setItem("AutoVerify" + location.pathname, JSON.stringify(A));
      console.log(A);
      break;

    case 8: //設定重新產生
      i = 7;
    case 2: //設定輸入框
      if (i == 0) i = 1;
    case 1: //設定驗證碼
      $(":visible").on("click", function () { set(this) }); //在元素上貼標籤
      Mode = i + 1;
      break;

    case 0: //點開插件
      res = {};
      if (A != null) res.engine = A[0] == 1 ? "A模式" : "B模式";
      else break;
      if (A[1] != null) res.img = "更換驗證碼圖片(已設定)";
      if (A[2] != null) res.box = "更換回答輸入框(已設定)";
      if (A[8] != null) res.ren = "更換重新產生按鈕(已設定)";
      res.filter = [A[3] != false, A[4] != false, A[5] != false, A[6] == true];
      res.word = (A[7] == null ? 4 : A[7]);
      sendResponse(res);
      break;

    default:
      console.log(request);
      break;
  }
});

function send(message) {
  chrome.runtime.sendMessage(message, res => {
    if (res != null) console.log(res);
  });
}

function img2txt(img, engine, elem) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  let b64img = canvas.toDataURL('image/jpeg');
  send({ info: 5, img: b64img });
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
      let OCR = Filter(r.ParsedResults[0].ParsedText);
      send({ info: 5, text: OCR });
      console.log(OCR);
      $(elem).val(OCR);
    }
    else {
      send({ info: 5, err: r.ErrorMessage });
      console.log(r);
    }
  });
}

function Filter(text) {
  console.log("In:", text);
  let OCR = text.match(/\w/g);
  if (OCR == null) return "";
  OCR = OCR.join("");
  let Up = A[3] != false, Do = A[4] != false, Di = A[5] != false;
  if (!Up && Do) OCR = OCR.replaceAll("I", "l").toLowerCase();
  else if (Up && !Do) OCR = OCR.replaceAll("l", "I").toUpperCase();
  else if (!Up && !Do) OCR = OCR.replaceAll(/o/gi, "0").replaceAll(/[lI]/g, "1");
  if (!Di) {
    OCR = OCR.replaceAll("0", "O").replaceAll("1", Up ? "I" : "l");
    if (!Up) OCR = OCR.toLowerCase();
  }
  console.log("Convert:", OCR);
  OCR = OCR.match(new RegExp("[" + (Up ? "A-Z" : "") + (Do ? "a-z" : "") + (Di ? "0-9" : "") + "]", 'g')).join("");
  console.log("Filter:", OCR);
  return OCR;
}