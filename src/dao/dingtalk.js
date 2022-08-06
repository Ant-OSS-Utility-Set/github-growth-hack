const fetch = require("node-fetch");

// https://open.dingtalk.com/document/group/custom-robot-access
const dingTalkDao = {
  send: function (groupUrls, content, title, atUid, isAtAll) {
    for (let group of groupUrls) {
      // 1.validate
      if (group == null || group.length == 0) {
        console.log("DingTalk groupUrls is empty");
        continue;
      }
      let uidArr = [];
      if (atUid != null) {
        uidArr = atUid;
      }
      // 2. send request
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

  sendMarkdown: function (groupUrls, content, title, atUid, isAtAll) {
    for (let group of groupUrls) {
      // 1.validate
      if (group == null || group.length == 0) {
        console.log("DingTalk groupUrls is empty");
        continue;
      }
      let uidArr = [];
      if (atUid != null) {
        uidArr = atUid;
      }
      // 2. send request
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
  nullToEmpty(str) {
    if (str == null) {
      return "";
    }
    return str;
  },
};

module.exports = {
  send: function (groupUrls, content, title, atUid, isAtAll) {
    return dingTalkDao.send(groupUrls, content, title, atUid, isAtAll);
  },
  sendMarkdown: function (groupUrls, content, title, atUid, isAtAll) {
    return dingTalkDao.sendMarkdown(groupUrls, content, title, atUid, isAtAll);
  },
};
