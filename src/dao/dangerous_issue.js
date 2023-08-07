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
  dingTalkDao:[],
  newOwers:[],
  start: function () { },
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
      let awards = [
        {
          content: `${this.keyword}目前没有舆情 issue ，大家回复很及时，奖励一人一辆特斯拉!\n`,
          img: "https://gw.alipayobjects.com/mdn/rms_6ac329/afts/img/A*PXPwR6je8-MAAAAAAAAAAAAAARQnAQ",
        },
        {
          content: `${this.keyword}目前没有舆情 issue ，大家回复很及时，奖励一人一辆 SpaceX 火箭!\n`,
          img: "https://gw.alipayobjects.com/mdn/rms_6ac329/afts/img/A*J7MsQKCp-H8AAAAAAAAAAAAAARQnAQ",
        },
        {
          content: `${this.keyword}目前没有舆情 issue ，大家回复很及时，奖励一人一个 脑机接口!\n`,
          img: "https://img-blog.csdnimg.cn/img_convert/15b784912f4511cbb9d35bb2c1bf5e91.png",
        },
        {
          content: `${this.keyword}目前没有舆情 issue ，大家回复很及时，奖励一人一罐 可口可乐!\n`,
          img: "https://gw.alipayobjects.com/mdn/rms_6ac329/afts/img/A*v6SsRKjmOWYAAAAAAAAAAAAAARQnAQ",
        },
      ];
      // give a random award!
      let idx = Math.floor(Math.random() * awards.length);
      let content = awards[idx].content;
      let img = awards[idx].img;
      this.send(content, null, true, "*", false, "issue");
      this.sendImage(img, null, false, "*", false, "issue");
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
      let uid = this.owners.get(project);
      let owerItem  = []

      if (!uid || uid.length === 0) {
        uid = [`${project}`];
      }
            this.newOwers.map((item)=>{
        if(item[1] === project){
          owerItem.push(item[0])
        }
      })
      
      let content = uid.map(id => id === project ? `请${owerItem}/${project}项目的相关` : `@${id}`).join('');
        content += `老师，有空看下${project}的issue哈, ${this.keyword}需要你：\n`;
        content += k.map(issue => `用户等了${issue.duration}天啦: ${issue.url}\n`).join('');
        // send
        this.send(content, uid, false, project, true, "issue");
    });
  },
  isIgnoredTopicType: function (topicTypesIgnore, messageType) {
    if (topicTypesIgnore != null && topicTypesIgnore.length > 0) {
      for (let topicType of topicTypesIgnore) {
        if (topicType == "*" || topicType == messageType) {
          return true;
        }
      }
    }
    return false;
  },
  interestedTopicType: function (topicTypesOnly, messageType) {
    if (topicTypesOnly == null || topicTypesOnly.length == 0) {
      return true;
    }
    for (let topicType of topicTypesOnly) {
      if (topicType == "*" || topicType == messageType) {
        return true;
      }
    }
    return false;
  },
  send: function (content, atUid, isAtAll, project, isNegative, topicType) {
    const topicTypeLiveness = "liveness";
    const topicTypeIssue = "issue";

    for (let group of this.dingGroups) {
      // 1.validate
      if (group.url == null || group.url.length == 0) {
        console.log("DingTalk url is empty");
        continue;
      }
      // check topic projects
      if (!this.interested(group.topicProjects, project)) {
        continue;
      }
      // check topicTypesIgnore
      if (this.isIgnoredTopicType(group.topicTypesIgnore, topicType)) {
        continue;
      }
      // check topicTypesOnly
      if (!this.interestedTopicType(group.topicTypesOnly, topicType)) {
        continue;
      }
      // check keyword in content
      let newContent = content;
      if (group.keyword != null && content.indexOf(group.keyword) < 0) {
        newContent = content.replace(this.keyword, group.keyword);
      }
      // append text
      if (topicType == topicTypeIssue) {
        if (isNegative) {
          newContent += this.nullToEmpty(group.issueWarningText);
        } else {
          newContent += this.nullToEmpty(group.issueCongratulationText);
        }
      } else if (topicType == topicTypeLiveness) {
        if (isNegative) {
          newContent += this.nullToEmpty(group.livenessWarningText);
        } else {
          newContent += this.nullToEmpty(group.livenessCongratulationText);
        }
      }
      let uidArr = [];
      if (atUid != null) {
        uidArr = atUid;
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
            atUserIds: uidArr,
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
  nullToEmpty(str) {
    if (str == null) {
      return "";
    }
    return str;
  },
  interested: function (topicProjects, project) {
    if (
      topicProjects == null ||
      topicProjects.length == 0 ||
      topicProjects == "*"
    ) {
      return true;
    }
    if (topicProjects.indexOf(project) >= 0) {
      return true;
    }
    return false;
  },

  sendImage: function (
    imageUrl,
    atUid,
    isAtAll,
    project,
    isNegative,
    topicType
  ) {
    for (let group of this.dingGroups) {
      // 1.validate
      if (group.url == null || group.url.length == 0) {
        console.log("DingTalk url is empty");
        continue;
      }
      // check topic project
      if (!this.interested(group.topicProjects, project)) {
        continue;
      }
      // check topicTypesIgnore
      if (this.isIgnoredTopicType(group.topicTypesIgnore, topicType)) {
        continue;
      }
      // check topicTypesOnly
      if (!this.interestedTopicType(group.topicTypesOnly, topicType)) {
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
    let reg = RegExp(',', "g")
    title = title.replace(reg, "，");
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
  setDingTalkGroup(groups, owners,newOwers) {
    dingTalkDao.dingGroups = groups;
    dingTalkDao.owners = owners;
    dingTalkDao.newOwers = newOwers
  },
  getDingTalkDao() {
    return dingTalkDao;
  },
};