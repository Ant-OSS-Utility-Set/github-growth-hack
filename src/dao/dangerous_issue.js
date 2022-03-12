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
  dingGroups: [],
  keyword: "我们的社区",
  owners: new Map(),
  start: function () {},
  // put the issue into the memory list
  insert: function (duration, project, title, url) {
    this.issues.push({
      duration: duration,
      project: project,
      title: title,
      url: url,
    });
  },
  // write to db
  commit: function () {
    // 1. check configuration
    if (this.dingGroups.length == 0) {
      // console.log("DingTalk url is empty");
      return;
    }
    // 2. check if all clear
    if (this.issues.length == 0) {
      // let content = `${this.keyword}目前没有舆情 issue ，大家回复很及时，奖励一人一辆特斯拉!\n`;
      let content = `${this.keyword}目前没有舆情 issue ，大家回复很及时，奖励一人一辆 SpaceX 火箭!\n`;
      this.send(content, null, true, "*");
      this.sendImage(
        // "https://gw.alipayobjects.com/mdn/rms_6ac329/afts/img/A*PXPwR6je8-MAAAAAAAAAAAAAARQnAQ",
        "https://gw.alipayobjects.com/mdn/rms_6ac329/afts/img/A*J7MsQKCp-H8AAAAAAAAAAAAAARQnAQ",
        null,
        false,
        "*"
      );
      return;
    }
    // 3. group by project
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
    // 4. send warning for each project
    // notify
    project2issues.forEach((k, project) => {
      // console.log(k, project, x);
      let uid = this.owners.get(project);
      // concatenate messages.
      let content = `@${uid} 老师，有空看下${project}的issue哈, ${this.keyword}需要你：\n `;
      // console.log(v);
      // console.log(content);
      k.forEach((issue) => {
        content += `用户等了${issue.duration}天啦: ${issue.url}\n`;
      });
      // send
      this.send(content, uid, false, project);
    });
  },
  send: function (content, atUid, isAtAll, project) {
    for (let group of this.dingGroups) {
      // 1.validate
      if (group.url == null || group.url.length == 0) {
        console.log("DingTalk url is empty");
        continue;
      }
      // check topic
      if (!this.interested(group.topicProjects, project)) {
        continue;
      }
      // check keyword in content
      let newContent = content;
      if (group.keyword != null && content.indexOf(group.keyword) < 0) {
        newContent = content.replace(this.keyword, group.keyword);
      }
      // 2. send request
      fetch(group.url, {
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
            content: newContent,
          },
          msgtype: "text",
          title: ``,
        }),
      })
        // 3. parse
        .then((res) => {
          return res.json();
        })
        .then((json) => console.log(json));
    }
  },
  interested: function (topicProjects, project) {
    if (topicProjects == null || topicProjects.length == "*") {
      return true;
    }
    if (topicProjects.indexOf(project) >= 0) {
      return true;
    }
    return false;
  },

  sendImage: function (imageUrl, atUid, isAtAll, project) {
    for (let group of this.dingGroups) {
      // 1.validate
      if (group.url == null || group.url.length == 0) {
        console.log("DingTalk url is empty");
        continue;
      }
      // check topic
      if (!this.interested(group.topicProjects, project)) {
        continue;
      }
      // check keyword in content
      let keyword = this.keyword;
      if (group.keyword != null) {
        keyword = group.keyword;
      }
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
            title: keyword,
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
    }
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
  setDingTalkGroup(groups, owners) {
    dingTalkDao.dingGroups = groups;
    dingTalkDao.owners = owners;
  },
};
