chrome.runtime.onInstalled.addListener(() => {
    let text = ["這是「驗證碼」", "這是「答案欄」", "這是「重新產生」", "辨識到剪貼簿"];
    let context = ["image", "editable", "all", "image"];
    for (var i = 0; i < text.length; i++) {
        chrome.contextMenus.create({
            id: "setElem" + (i + 1),
            title: text[i],
            contexts: [context[i]]
        });
    }
});

function send(tabId, message) {
    chrome.tabs.sendMessage(tabId, message);
}

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    send(tab.id, { info: 'menu', index: parseInt(info.menuItemId.substr(-1)) });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.info) {
        case 'load':
            chrome.storage.sync.get([request.url], e => { send(sender.tab.id, { info: 'load', data: e }) });
            break;
        case 'save':
            chrome.storage.sync.set(request.data);
            break;

        default:
            request.from = sender.tab ? "content >" + sender.tab.url : "popup";
            console.log(request);
            break;
    }
    sendResponse(null);
});