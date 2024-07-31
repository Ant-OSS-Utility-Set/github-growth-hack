const fetch = require("node-fetch");

// https://open.dingtalk.com/document/group/custom-robot-access
const dingTalkDao = {
  // 发送消息
  send: function (groupUrls, content, title, atUid, isAtAll) {
    // 遍历groupUrls数组
    for (let group of groupUrls) {
      // 1.validate
      // 判断groupUrls数组是否为空
      if (group == null || group.length == 0) {
        console.log("DingTalk groupUrls is empty");
        continue;
      }
      let uidArr = [];
      if (atUid != null) {
        uidArr = atUid;
      }
      // 2. send request
      // 发送请求
      fetch(group, {
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
            content: content,
          },
          msgtype: "text",
          title: `${title}`,
        }),
      })
        // 3. parse
        .then((res) => {
          return res.json();
        })
        .then((json) => console.log(json));
    }
  },

  // 发送markdown消息
  sendMarkdown: function (groupUrls, content, title, atUid, isAtAll) {
    // 遍历groupUrls数组
    for (let group of groupUrls) {
      // 1.validate
      // 判断groupUrls数组是否为空
      if (group == null || group.length == 0) {
        console.log("DingTalk groupUrls is empty");
        continue;
      }
      let uidArr = [];
      if (atUid != null) {
        uidArr = atUid;
      }
      // 2. send request
      // 发送请求
      fetch(group, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          msgtype: "markdown",
          markdown: {
            title: `${title}`,
            text: content,
          },
          at: {
            atMobiles: [""],
            atUserIds: uidArr,
            isAtAll: isAtAll,
          },
        }),
      })
        // 3. parse
        .then((res) => {
          return res.json();
        })
        .then((json) => console.log(json));
    }
  },
  // 将null转换为空字符串
  nullToEmpty(str) {
    if (str == null) {
      return "";
    }
    return str;
  },
};

module.exports = {
  // 发送消息
  send: function (groupUrls, content, title, atUid, isAtAll) {
    // 调用dingTalkDao的send方法，发送消息
    return dingTalkDao.send(groupUrls, content, title, atUid, isAtAll);
  },
  // 发送markdown消息
  sendMarkdown: function (groupUrls, content, title, atUid, isAtAll) {
    // 调用dingTalkDao的sendMarkdown方法，发送markdown消息
    return dingTalkDao.sendMarkdown(groupUrls, content, title, atUid, isAtAll);
  },
};