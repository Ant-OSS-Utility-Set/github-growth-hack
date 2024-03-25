const fs = require("fs");
const config = require("../../configs/config.json");
const {getConfig} = require("../const");
const { getConn, query } = require("./mysql_conn");
const { getImDao } = require("./im");
const {utils} = require("../utils/time_utils");

const mysqlDao = {

  sendAlarmMysql:function sendAlarmMysql(alarm) {
    // 获取连接
    let conn = getConn();
    // 如果连接为空，则返回
    if (conn == null) {
      console.log("mysql connection is null");
      return;
    }
    // 构建sql语句
    let sql =
        `INSERT INTO \`github_alarm_info\` (\`scanFrom\`, \`scanTo\`, \`alarmType\`, \`alarmChannel\`, \`alarmStatus\`, \`owner\`, \`project\`, \`issueNum\`, \`alarmContent\`, \`createTime\`)` +
        ` VALUES ("${alarm.scanFrom}","${alarm.scanTo}","${alarm.alarmType}"` +
        `,'${alarm.alarmChannel}','${alarm.alarmStatus}'` +
        `,"${alarm.owner}","${alarm.repo}"` +
        `,${alarm.issueNum},'${alarm.alarmContent}','${utils.today()}')`;
    // 执行sql语句
    conn.query(sql, function (err, result) {
      console.log("插入埋点数据：")
      // 如果出错，则抛出错误
      if (err) {
        console.log(err);
        throw err;
      }
    });
  },
  commitMysql:function () {
    // 获取连接
    let conn = getConn();
    // 如果连接为空，则返回
    if (conn != null) {
      conn.end()
    }
  }
}

const dingTalkDao = {
  issuesForDingTalk: new Map(),
  livenessCheck:  new Map(),
  start: function () { },
  // put the issue into the memory list
  insert: function (duration, project, title, url, owner) {
      // 将duration、project、title、url、keyword参数添加到this.issues数组中
    if(this.issuesForDingTalk.get(owner)==null){
      this.issuesForDingTalk.set(owner,[])
    }
    if(project!=null){
      this.issuesForDingTalk.get(owner).push({
        duration: duration,
        project: project,
        title: title,
        url: url,
        owner: owner
      });
    }
  },
  insertLivenessCheck: function (owner,project) {
    if(this.livenessCheck.get(owner)==null){
      this.livenessCheck.set(owner,[])
    }
    if(project!=null){
      this.livenessCheck.get(owner).push({
        project: project,
      })
    }

  },
  sendLiveness:async function(livenessCheckElement,owner,ownerDingTalkGroupConfig){
    if (livenessCheckElement > 0) {
      let livenessContent = this.concatLivenessContent(owner, livenessCheckElement, ownerDingTalkGroupConfig);
      await getImDao.send(livenessContent, null, false, true, "liveness", ownerDingTalkGroupConfig);
    } else {
      await this.sendSuccessLivecheck(owner, ownerDingTalkGroupConfig)
    }
  },
  // write to dingtalk
  commit: async function () {


    for (const [owner, value] of this.issuesForDingTalk) {
      const ownerDingTalkGroupConfig = getConfig(null, config.orgRepoConfig[owner]['dingTalkGroupConfig'], config.generalConfig['dingTalkGroupConfig']);
      if (value.length > 0) {
        let issueContent = this.concatIssueContent(owner, value, ownerDingTalkGroupConfig);
        await getImDao().send(issueContent, null, false, true, "issue", ownerDingTalkGroupConfig);
      } else {
        await this.sendNoIssue(owner, ownerDingTalkGroupConfig)
      }
      //顺序每个社区发送
      let livenessCheckElement = this.livenessCheck.get(owner);
      if(livenessCheckElement == null){
        continue;
      }
      this.livenessCheck.delete(owner)
      await this.sendLiveness(livenessCheckElement,owner,ownerDingTalkGroupConfig);
    }
    //在循环剩下的。主要是为了达到同一个社区顺序发送的消息
    for (const [owner, value] of this.livenessCheck) {
      const ownerDingTalkGroupConfig = getConfig(null, config.orgRepoConfig[owner]['dingTalkGroupConfig'], config.generalConfig['dingTalkGroupConfig']);
      await this.sendLiveness(value,owner,ownerDingTalkGroupConfig);
    }



    //提交后重置
    this.issuesForDingTalk = new Map
    this.livenessCheck = new Map
  },

  concatLivenessContent : function concatLivenessContent(owner,livenessCheck,dingTalkGroupConfig) {

    let repos =  livenessCheck.map(issue => issue.project).join(',');
    return `${owner}社区的${repos}项目健康检查 (liveness check) 失败!\n` +
        `项目满足以下条件，被归类为“腐烂级”项目：\n` +
        `- 存在大于30天未回复的 issue \n` +
        `- 连续4周活跃度小于20\n` +
        `请在一周内整改，否则将启动垃圾回收程序，对项目自动归档！\n`;
  },
  concatIssueContent : function concatIssueContent(owner,issues,dingTalkGroupConfig) {
    let allContent=`${owner}社区的issue告警：\n`;
    // 3. group by project
    // sort
   issues.sort((a, b) => {
      return b.duration - a.duration;
    });
    // group by project
    let project2issues = new Map();
   issues.forEach((issue) => {
      let name = issue.owner+"/"+issue.project;
      if (project2issues.get(name) == null) {
        project2issues.set(name, {
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
      const project = key.split('/')[1];
      let uid = dingTalkGroupConfig['owners'][`${owner}/${project}`]
      let issues = value.repoIssues.slice(0,config.generalConfig.dangerousIssuesConfig.maxIssueNums)

      // 如果没有获取到项目uid，则设置为项目名
      if (!uid || uid.length === 0) {
        uid = [`${key}`];
      }

      // 拼接消息内容
      let content = uid.map(id => id === project ? `请${owner}/${project}项目的相关` : `@${id}`).join('');
      content += `老师，有空看下${project}的issue哈, ${owner}需要你：\n`;
      content += issues.map(issue => `用户等了${issue.duration}天啦: ${issue.url}\n`).join('');
      if (dingTalkGroupConfig['nickName'] != null && content.indexOf(dingTalkGroupConfig['nickName']) < 0) {
        content = content.replace(owner, dingTalkGroupConfig['nickName']);
      }
      allContent += content+"\n";
    })
  return allContent;
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
  sendSuccessLivecheck: async function (owner, dingTalkGroupConfig) {
    let content =
        `${owner}社区活跃度检查 (liveness check)结果：所有项目通过了活跃度检查!\n` +
        `\n` +
        `注：liveness check会检查每个项目的健康情况，如果满足下列条件会被归类为“腐烂级”项目：\n` +
        `- 存在大于30天未回复的 issue \n` +
        `- 连续4周活跃度小于20\n`;
    await getImDao().send(content, null, false, false, "liveness", dingTalkGroupConfig);
  },
  sendNoIssue: async function (owner, dingTalkGroupConfig) {
    let awards = [
      {
        content: `${owner}目前没有舆情 issue ，大家回复很及时，奖励一人一辆特斯拉!\n`,
        img: "https://gw.alipayobjects.com/mdn/rms_6ac329/afts/img/A*PXPwR6je8-MAAAAAAAAAAAAAARQnAQ",
      },
      {
        content: `${owner}目前没有舆情 issue ，大家回复很及时，奖励一人一辆 SpaceX 火箭!\n`,
        img: "https://gw.alipayobjects.com/mdn/rms_6ac329/afts/img/A*J7MsQKCp-H8AAAAAAAAAAAAAARQnAQ",
      },
      {
        content: `${owner}目前没有舆情 issue ，大家回复很及时，奖励一人一个 脑机接口!\n`,
        img: "https://img-blog.csdnimg.cn/img_convert/15b784912f4511cbb9d35bb2c1bf5e91.png",
      },
      {
        content: `${owner}目前没有舆情 issue ，大家回复很及时，奖励一人一罐 可口可乐!\n`,
        img: "https://gw.alipayobjects.com/mdn/rms_6ac329/afts/img/A*v6SsRKjmOWYAAAAAAAAAAAAAARQnAQ",
      },
    ];
    // give a random award!
    let idx = Math.floor(Math.random() * awards.length);
    let content = awards[idx].content;
    let img = awards[idx].img;
    await getImDao().send(content, null, false, false, "issue", dingTalkGroupConfig);
    await getImDao().sendImage(img, null, false, false, "issue", owner, dingTalkGroupConfig);
  }

};

const fsDAOImpl = {
  filePath: "./dangerous_issues.csv",
  header: "duration,repo,title,url",
  // chinese report here
  filePath_zh: "./dangerous_issues_zh.csv",
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
  insert: function (duration, project, title, url, owner) {
    if(project!=null){
      fsDAOImpl.insert(duration, project, title, url);
    }
    dingTalkDao.insert(duration, project, title, url, owner);
  },
  insertLivenessCheck:function (owner,project){
    dingTalkDao.insertLivenessCheck(owner,project)
  },
  commit: function (owner,dingTalkGroupConfig) {
    fsDAOImpl.commit();
    dingTalkDao.commit();
  },

  getMysqlDao(){
    return mysqlDao;
  }
};