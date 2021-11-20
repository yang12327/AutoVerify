let C = 0;
chrome.storage.local.get("C", r => {
    C = r.C;
    if (C == null) C = 0;
})
// setInterval(() => {
//     console.log(C++);
// }, 1000);


chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name == "counter") {
        chrome.tabs.create({ url: "https://www.google.com/" + alarm.name + C })
    }
    console.log(C++, alarm, new Date());
    chrome.storage.local.set({ C: C });
});

// chrome.alarms.create("counter", { delayInMinutes: 1, periodInMinutes: 1 });
