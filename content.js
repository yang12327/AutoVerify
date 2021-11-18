let A = null;
let errCount = 0;
$(() => {
  A = JSON.parse(localStorage.getItem("AutoVerify" + location.pathname));
  Load();
  if (A != null && A[8] != null) {
    let t = FindElem(8).obj;
    if (t != null)
      $(t).on("click", Load);
  }
})
function Load() { //載入頁面
  if (A == null) return "未設定任何參數";
  let elem = [];
  for (let i = 1; i <= 2; i++) {
    let e = FindElem(i);
    if (e.obj == null) return e.err;
    elem.push(e.obj);
  }
  setTimeout(() => { img2txt(elem[0], A[0], elem[1]); }, 300);
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
  if (Mode == 8) elem.on("click", Load);
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
      errCount = 0;
      if ((res = Load()) != null)
        alert(res);
      break;

    case 9: //模式C
      i = 2;
    case 4: //模式B
      if (i == 0) i = 1;
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
      if (A != null) res.engine = A[0] == 1 ? "A模式" : A[0] == 2 ? "B模式" : "C模式";
      else break;
      if (A[1] != null) res.img = "更換驗證碼圖片(已設定)";
      if (A[2] != null) res.box = "更換回答輸入框(已設定)";
      if (A[8] != null) res.ren = "更換重新產生按鈕(已設定)";
      res.filter = [A[3] != false, A[4] != false, A[5] != false, A[6]];
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

  function response(r) {
    if (r.text != null) {
      let OCR = Filter(r.text);
      send({ info: 5, text: OCR });
      if (Fail(OCR)) return;
      errCount = 0;
      $(elem).val(OCR);
    }
    else {
      send({ info: 5, err: r.err });
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

      break;

    default:
      break;
  }
}

function AntiCaptcha(b64img, numic, response) {

}

function OCRspace(b64img, engine, response) {
  $.ajax({
    "url": "https://api.ocr.space/parse/image",
    "method": "POST",
    "timeout": 3000,
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
    if (A[6]) { //有開啟篩選器
      let t = FindElem(8).obj;
      if (t != null && OCR.length != (A[7] == null ? 4 : A[7])) {
        $(t).click();
        console.log("Retry(" + errCount + ")");
        return true;
      }
    }
    return false;
  } else {
    console.log("Retry(" + errCount + ") & Stop");
    alert("辨識失敗太多次！\n你還是自己輸入吧😢");
    return true;
  }
}

function Filter(text) {
  console.log(" In:", text);
  let OCR = text.match(/\w/g);
  if (OCR == null) return "";
  OCR = OCR.join("");
  let Up = A[3] != false, Do = A[4] != false, Di = A[5] != false;
  if (!Up && Do) OCR = OCR.replaceAll("I", "l").toLowerCase();
  else if (Up && !Do) OCR = OCR.replaceAll("l", "I").toUpperCase();
  else if (!Up && !Do) OCR = OCR.replaceAll(/o/gi, "0").replaceAll(/[lI]/g, "1").replaceAll(/z/gi, "2");
  if (!Di) {
    OCR = OCR.replaceAll("0", "O").replaceAll("1", Up ? "I" : "l").replaceAll("2", "Z");
    if (!Up) OCR = OCR.toLowerCase();
  }
  OCR = OCR.match(new RegExp("[" + (Up ? "A-Z" : "") + (Do ? "a-z" : "") + (Di ? "0-9" : "") + "]", 'g')).join("");
  console.log("Out:", OCR);
  return OCR;
}