let C = 0;
// setInterval(() => {
//     console.log(C++);
// }, 1000);


chrome.alarms.onAlarm.addListener(alarm => {
    console.log(C++, alarm, new Date());
});

chrome.alarms.create("counter", { delayInMinutes: 1, periodInMinutes: 1 });
