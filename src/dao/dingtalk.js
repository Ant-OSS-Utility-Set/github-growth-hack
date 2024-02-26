const fetch = require("node-fetch");
//钉钉发送client
const dingtalk = {
 send : function send(group, newContent, uidArr, isAtAll) {
    return fetch(group.url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            at: {
                atMobiles: [""],
                atUserIds: uidArr,
                isAtAll: isAtAll,
            },
            text: {
                content: newContent,
            },
            msgtype: "text"
        }),
    })
        .then((res) => {
            return res.json();
        })
        .then((json) => {
            console.log( `发送IM:${newContent}结果：`);
            console.log(json);
        });
},

    sendMarkdown :function sendMarkdown(group, nickName, imageUrl, atUid, isAtAll) {
    // 2. send request
    fetch(group.url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            msgtype: "markdown",
            markdown: {
                title: nickName+" issue",
                text: `![](${imageUrl}) \n`,
            },
            at: {
                atMobiles: [""],
                atUserIds: [atUid],
                isAtAll: isAtAll,
            },
        }),
    })
        // 3. parse
        .then((res) => {
            return res.json();
        })
        .then((json) => console.log("发送图片结果：", json));
}
};


module.exports = {
    dingtalk:dingtalk
};