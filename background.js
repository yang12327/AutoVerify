chrome.runtime.onInstalled.addListener(() => {
    let contexts = ["驗證碼", "答案欄", "重新產生"];
    for (var i = 0; i < contexts.length; i++) {
        chrome.contextMenus.create({
            id: "setElem" + (i + 1),
            title: "這是「" + contexts[i] + "」",
            contexts: ["all"]
        });
    }
});

function send(tabId, message) {
    // console.log(tabId);
    chrome.tabs.sendMessage(tabId, message);
}

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    send(tab.id, { info: 'menu', index: parseInt(info.menuItemId.substr(-1)) });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request);
    switch (request.info) {
        case 'load':
            chrome.storage.sync.get([request.url], e => { send(sender.tab.id, { info: 'load', data: e }) });
            break;
        case 'save':
            chrome.storage.sync.set(request.data, console.log);
            break;

        default:
            request.from = sender.tab ? "content >" + sender.tab.url : "popup";
            console.log(request);
            break;
    }
    sendResponse(null);
});