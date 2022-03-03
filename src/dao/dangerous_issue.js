const fs = require("fs");
const moment = require("moment");
const fetch = require("node-fetch");

const dingTalkDao = {
  // The data structure in this array is:
  // {
  //   duration: duration,
  //   project: project,
  //   title: title,
  //   url: url,
  // }
  issues: [],
  url: "",
  keyword: "我们",
  owners: new Map(),
  start: function () {},
  insert: function (duration, project, title, url) {
    this.issues.push({
      duration: duration,
      project: project,
      title: title,
      url: url,
    });
  },
  commit: function () {
    // 1. check configuration
    if (this.url.length == 0) {
      // console.log("DingTalk url is empty");
      return;
    }
    // 2. check if all clear
    if (this.issues.length == 0) {
      let content = `${this.keyword}目前没有舆情 issue ，大家回复很及时，奖励一人一辆特斯拉!\n`;
      this.send(content, null, true);
      this.sendImage(
        "https://gw.alipayobjects.com/mdn/rms_6ac329/afts/img/A*PXPwR6je8-MAAAAAAAAAAAAAARQnAQ",
        null,
        false
      );
      return;
    }
    // 3. send warning
    // sort
    this.issues.sort((a, b) => {
      return b.duration - a.duration;
    });
    // group by project
    let project2issues = new Map();
    this.issues.forEach((issue) => {
      let name = issue.project;
      if (project2issues.get(name) == null) {
        project2issues.set(name, []);
      }
      let list = project2issues.get(name);
      list.push(issue);
    });
    // notify
    project2issues.forEach((k, v) => {
      // console.log(k, v);
      let uid = this.owners.get(v);
      // concatenate messages.
      let content = `@${uid} 老师，有空看下${v}的issue哈, ${this.keyword}需要你：\n `;
      // console.log(v);
      // console.log(content);
      k.forEach((issue) => {
        content += `用户等了${issue.duration}天啦: ${issue.url}\n`;
      });
      // send
      this.send(content, uid, false);
    });
  },
  send: function (content, atUid, isAtAll) {
    fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        at: {
          atMobiles: [""],
          atUserIds: [atUid],
          isAtAll: isAtAll,
        },
        text: {
          content: content,
        },
        msgtype: "text",
        title: "",
      }),
    })
      // 3. parse
      .then((res) => {
        return res.json();
      })
      .then((json) => console.log(json));
  },
  sendImage: function (imageUrl, atUid, isAtAll) {
    fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        msgtype: "markdown",
        markdown: {
          title: `${this.keyword}`,
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
      .then((json) => console.log(json));
  },
};

const fsDAOImpl = {
  filePath: "dangerous_issues.csv",
  header: "duration,repo,title,url",
  // chinese report here
  filePath_zh: "dangerous_issues_zh.csv",
  header_zh: "帖子发了多久（天）,repo,title,url",
  // The data structure in this array is:
  // {
  //   duration: duration,
  //   project: project,
  //   title: title,
  //   url: url,
  // }
  issues: [],
  start: function () {
    try {
      // en
      fs.writeFileSync(this.filePath, "\uFEFF" + this.header + "\n", "utf8");
      // zh
      fs.writeFileSync(
        this.filePath_zh,
        "\uFEFF" + this.header_zh + "\n",
        "utf8"
      );
    } catch (err) {
      console.error(err);
    }
  },
  insert: function (duration, project, title, url) {
    title = title.replaceAll(",", "，");
    this.issues.push({
      duration: duration,
      project: project,
      title: title,
      url: url,
    });
  },
  commit: function () {
    // sort
    this.issues.sort((a, b) => {
      return b.duration - a.duration;
    });
    // write file
    let content = "";
    this.issues.forEach((issue) => {
      content += `${issue.duration},${issue.project},${issue.title},${issue.url} \n`;
    });

    fs.appendFile(this.filePath, content, function (err) {
      if (err) {
        console.log(err);
      } else {
        // console.log("ok.");
      }
    });
    fs.appendFile(this.filePath_zh, content, function (err) {
      if (err) {
        console.log(err);
      } else {
        // console.log("ok.");
      }
    });
  },
};

module.exports = {
  start: function () {
    fsDAOImpl.start();
    dingTalkDao.start();
  },
  insert: function (duration, project, title, url) {
    fsDAOImpl.insert(duration, project, title, url);
    dingTalkDao.insert(duration, project, title, url);
  },
  commit: function () {
    fsDAOImpl.commit();
    dingTalkDao.commit();
  },
  setDingTalkGroup(url, keyword, owners) {
    dingTalkDao.url = url;
    dingTalkDao.keyword = keyword;
    dingTalkDao.owners = owners;
  },
};
