const fs = require("fs");
const moment = require("moment");
const fetch = require("node-fetch");

const dingTalkDao = {
  issues: [],
  dingGroups: [],
  keyword: "我们的社区",
  owners: new Map(),
  dingTalkDao: [],
  newOwers: [],
  issuess: new Map(),
  start: function () { },
  // put the issue into the memory list
  insert: function (duration, project, title, url, keyword,option) {
    // if (keyword) {
    //   let name = keyword
    //   // 判断issuess中是否存在name
    //   if (this.issuess.get(name) == null) {
    //     // 如果不存在，则添加name
    //     this.issuess.set(name, []);
    //   }
    //   // 获取name对应的list
    //   let list = this.issuess.get(name);
    //   // 将duration, project, title, url, keyword添加到list中
    //   list.push({
    //     duration: duration,
    //     project: project,
    //     title: title,
    //     url: url,
    //     keyword: keyword
    //   });
    // } else {
      // 将duration、project、title、url、keyword参数添加到this.issues数组中
      this.issues.push({
        duration: duration,
        project: project,
        title: title,
        url: url,
        keyword: keyword,
        option:option
      });
    // }
  },
  // write to db
  commit: function () {
    if(this.issues.length===0){
      this.sendNoIssue(keyword,option);
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
      let name = issue.keyword+"/"+issue.project;
      if (project2issues.get(name) == null) {
        project2issues.set(name, {
          repoOption:issue.option,
          repoIssues:[]
        });
      }
      let list = project2issues.get(name).repoIssues;
      list.push(issue);
    });
    // 4. send warning for each project
    // notify
    project2issues.forEach((value, key) => {
      // key 项目名
      // value 该项目的问题集合
      // 获取项目uid
      //keyword=owner，为啥叫keyword
      const keyword = key.split('/')[0];
      const project = key.split('/')[1];
      let uid = value.repoOption['dingTalkGroupConfig']['owners']
      let issues = value.repoIssues

      // 如果没有获取到项目uid，则设置为项目名
      if (!uid || uid.length === 0) {
        uid = [`${key}`];
      }

      // 拼接消息内容
      let content = uid.map(id => id === project ? `请${keyword}/${project}项目的相关` : `@${id}`).join('');
      content += `老师，有空看下${project}的issue哈, ${this.keyword}需要你：\n`;
      content += issues.map(issue => `用户等了${issue.duration}天啦: ${issue.url}\n`).join('');
      // send
      this.send(content, uid, false, project, true, "issue", keyword,value.repoOption);
    });
  },
  isIgnoredTopicType: function (topicTypesIgnore, messageType) {
    // 判断topicTypesIgnore是否不为空且长度大于0
    if (topicTypesIgnore != null && topicTypesIgnore.length > 0) {
      // 遍历topicTypesIgnore
      for (let topicType of topicTypesIgnore) {
        // 如果topicType为*或者topicType等于messageType，返回true
        if (topicType == "*" || topicType == messageType) {
          return true;
        }
      }
    }
    // 否则返回false
    return false;
  },
  interestedTopicType: function (topicTypesOnly, messageType) {
    // 判断topicTypesOnly是否为空
    if (topicTypesOnly == null || topicTypesOnly.length == 0) {
      // 返回true
      return true;
    }
    // 遍历topicTypesOnly
    for (let topicType of topicTypesOnly) {
      // 判断topicType是否为*或者是否等于messageType
      if (topicType == "*" || topicType == messageType) {
        // 返回true
        return true;
      }
    }
    // 返回false
    return false;
  },
  sendNoIssue: function (keyword,option) {
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
    this.send(content, null, true, "*", false, "issue",keyword,option);
    this.sendImage(img, null, false, "*", false, "issue",keyword,option);
  },
  /**
   * 这里的keyword等于owner好像
   * @param content
   * @param atUid
   * @param isAtAll
   * @param project
   * @param isNegative
   * @param topicType
   * @param keyword
   * @param option
   */
  send: function (content, atUid, isAtAll, project, isNegative, topicType, keyword,option) {
    const topicTypeLiveness = "liveness";
    const topicTypeIssue = "issue";
    const groups = option["dingTalkGroupConfig"]["groups"]

    for (let group of groups) {
      //keyword匹配才可以发送。如果keyword没有配置，则放行。
      if (keyword && group['keyword']!=null) {
        // dingGroups.group.keyword中是否有和keyword匹配的
        if (groups.some(item => item['keyword']!=null &&  item['keyword'].toLowerCase() === keyword)) {
          // 如果group的keyword不等于keyword，则跳过
          if (group['keyword'].toLowerCase() !== keyword) {
            continue;
          }
        } else if (group['keyword'] !== "SOFAStack") {
          // 如果group的keyword不等于SOFAStack，则跳过
          continue;
        }
      }
      // 1.validate
      // 检查url是否为空
      if (group['url'] == null || group['url'].length === 0) {
        console.log("DingTalk url is empty");
        continue;
      }
      // check topic projects
      // 检查group.topicProjects中是否包含project
      if (!this.interested(group['topicProjects'], project)) {
        continue;
      }
      // check topicTypesIgnore
      // 检查group['topicTypesIgnore']是否为*或者是否等于topicType
      if (this.isIgnoredTopicType(group['topicTypesIgnore'], topicType)) {
        continue;
      }
      // check topicTypesOnly
      // 检查group['topicTypesOnly']是否为*或者是否等于topicType
      if (!this.interestedTopicType(group['topicTypesOnly'], topicType)) {
        continue;
      }
      // check keyword in content
      // 检查content中是否有group.keyword，没有则替换this.keyword
      let newContent = content;
      if (group['keyword'] != null && content.indexOf(group['keyword']) < 0) {
        newContent = content.replace(keyword, group['keyword']);
      }
      // append text
      // 添加链接文本
      if (topicType === topicTypeIssue) {
        if (isNegative) {
          newContent += this.nullToEmpty(group['issueWarningText']);
        } else {
          //没有issue，不会发消息，这个实际没有用到
          newContent += this.nullToEmpty(group['issueCongratulationText']);
        }
      } else if (topicType === topicTypeLiveness) {
        if (isNegative) {
          newContent += this.nullToEmpty(group['livenessWarningText']);
        } else {
          newContent += this.nullToEmpty(group['livenessCongratulationText']);
        }
      }
      let uidArr = [];
      if (atUid != null) {
        uidArr = atUid;
      }
      // 2. send request
      //发送请求
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
        .then((json) => {
          console.log( `${keyword}/${project}项目[${topicType}]发送钉钉机器人(${group.url})的结果：`)
          console.log(json)
        });
    }
  },
  nullToEmpty(str) {
    // 如果str为null，则返回空字符串
    if (str == null) {
      return "";
    }
    // 否则返回str
    return str;
  },
  interested: function (topicProjects, project) {
    // 如果topicProjects为空或者长度为0或者topicProjects为*
    if (
      topicProjects == null ||
      topicProjects.length == 0 ||
      topicProjects == "*"
    ) {
      // 返回true
      return true;
    }
    // 如果topicProjects中包含project
    if (topicProjects.indexOf(project) >= 0) {
      // 返回true
      return true;
    }
    // 否则返回false
    return false;
  },
  sendImage: function (imageUrl, atUid, isAtAll, project, isNegative, topicType, keyword,option) {
    const groups = option["dingTalkGroupConfig"]["groups"]
    for (let group of groups) {
      if (keyword) {
        if(group['keyword']==null){
          continue
        }
        // dingGroups.group.keyword中是否有和keyword匹配的
        if (groups.some(item => item['keyword']!=null && item['keyword'].toLowerCase() == keyword)) {
          // 如果group的keyword不等于keyword，则跳过
          if (group['keyword'].toLowerCase() !== keyword) {
            continue;
          }
        } else if (group['keyword'] !== "SOFAStack") {
          // 如果group的keyword不等于SOFAStack，则跳过
          continue;
        }
      }
      // 1.validate
      if (group.url == null || group.url.length == 0) {
        console.log("DingTalk url is empty");
        continue;
      }
      // check topic project
      if (!this.interested(group['topicProjects'], project)) {
        continue;
      }
      // check topicTypesIgnore
      if (this.isIgnoredTopicType(group['topicTypesIgnore'], topicType)) {
        continue;
      }
      // check topicTypesOnly
      if (!this.interestedTopicType(group['topicTypesOnly'], topicType)) {
        continue;
      }
      // check keyword in content
      // let keyword = this.keyword;
      if (group['keyword'] != null) {
        keyword = group['keyword'];
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
  insert: function (duration, project, title, url, keyword,option) {
    fsDAOImpl.insert(duration, project, title, url);
    dingTalkDao.insert(duration, project, title, url, keyword,option);
  },
  commit: function () {
    fsDAOImpl.commit();
    dingTalkDao.commit();
  },
  setDingTalkGroup(groups, owners, newOwners) {
    dingTalkDao.dingGroups = groups;
    dingTalkDao.owners = owners;
    dingTalkDao.newOwers = newOwners;
    //不知道这2个是干嘛用的
    // dingTalkDao.issuess.set("sofastack", []);
    // dingTalkDao.issuess.set("antvis", []);
  },
  getDingTalkDao() {
    return dingTalkDao;
  },
};