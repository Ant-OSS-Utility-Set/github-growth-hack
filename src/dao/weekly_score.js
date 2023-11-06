const fs = require("fs");
const { getConn, query } = require("./mysql_conn");

const weeklyScoreDAO = {
  // 启动DAO
  start: function () {
    // 启动fsDAOImpl
    fsDAOImpl.start();
    // 启动mysqlDAOImpl
    mysqlDAOImpl.start();
  },
  // 插入数据
  insert: function (
    rank,
    score,
    owner,
    repoName,
    new_stars,
    new_contributors,
    new_forks,
    new_pr,
    closed_pr,
    newIssue,
    closeIssue,
    prComment,
    issueComment,
    sinceReadable,
    toReadable,
    now
  ) {
    // 插入数据到fsDAOImpl
    fsDAOImpl.insert(
      rank,
      score,
      owner,
      repoName,
      new_stars,
      new_contributors,
      new_forks,
      new_pr,
      closed_pr,
      newIssue,
      closeIssue,
      prComment,
      issueComment,
      sinceReadable,
      toReadable,
      now
    );
    // 插入数据到mysqlDAOImpl
    mysqlDAOImpl.insert(
      rank,
      score,
      owner,
      repoName,
      new_stars,
      new_contributors,
      new_forks,
      new_pr,
      closed_pr,
      newIssue,
      closeIssue,
      prComment,
      issueComment,
      sinceReadable,
      toReadable,
      now
    );
  },
  // 列出数据
  list: function (owner, repo, weeks) {
    // 返回mysqlDAOImpl中的数据
    return mysqlDAOImpl.list(owner, repo, weeks);
  },
  // 提交
  commit: function () {
    // 提交fsDAOImpl
    fsDAOImpl.commit();
    // 提交mysqlDAOImpl
    mysqlDAOImpl.commit();
  },
};
const mysqlDAOImpl = {
  // 初始化函数
  start: function () {},
  // 插入函数
  insert: function (
    rank,
    score,
    owner,
    repoName,
    new_stars,
    new_contributors,
    new_forks,
    new_pr,
    closed_pr,
    new_issues,
    closed_issues,
    pr_comment,
    issue_comment,
    sinceReadable,
    toReadable,
    now
  ) {
    // 获取连接
    let conn = getConn();
    // 如果连接为空，则返回
    if (conn == null) {
      // console.log("mysql connection is null");
      return;
    }
    // 构建sql语句
    sql =
      `INSERT INTO \`github_repo_weekly\` (\`date_from\`, \`date_to\`, \`record_date\`, \`rank\`, \`score\`, \`owner\`, \`project\`, \`new_stars\`, \`new_contributors\`, \`new_forks\`, \`new_pr\`, \`closed_pr\`, \`new_issues\`, \`closed_issues\`, \`pr_comment\`, \`issue_comment\`)` +
      ` VALUES ("${sinceReadable}","${toReadable}","${now}"` +
      `,${rank},${score}` +
      `,"${owner}","${repoName}"` +
      `,${new_stars},${new_contributors},${new_forks}` +
      `,${new_pr},${closed_pr}` +
      `,${new_issues},${closed_issues}` +
      `,${pr_comment},${issue_comment})`;
    // 执行sql语句
    conn.query(sql, function (err, result) {
      // 如果出错，则抛出错误
      if (err) {
        console.log(err);
        throw err;
      }
      // console.log("Result: " + result);
    });
  },
  // 列出函数
  list: function (owner, repo, weeks) {
    // 查询指定项目，按照id降序排列，取4条数据
    return query(
      `SELECT * FROM \`github_repo_weekly\` where project='${repo}' order by id desc LIMIT 4`
    );
    // .then(function (data) {
    //     if(data.rows[0]!=undefined)
    //     {
    //         return;
    //     }
    // })
  },
  // 提交函数
  commit: function () {
    // 获取连接
    let conn = getConn();
    // 如果连接为空，则返回
    if (conn == null) {
      // console.log("mysql connection is null");
      return;
    }
    // // 提交事务
    // conn.commit(function (err) {
    //   // 如果有错误，则抛出错误
    //   console.log(err);
    // });
    // 关闭连接
    conn.end();
  },
};
const fsDAOImpl = {
  // 初始化
  start: function () {
    // 英文
    this.startEn(
      `rank\tscore\towner\tproject\tnew_stars\tnew_contributors\tnew_forks\tnew_pr\tclosed_pr\tnew_issues\tclosed_issues\tpr_comment\tissue_comment\tdate_from\tdate_to\trecord_date`
    );
    // 中文
    this.startZh(
      `排名,活跃度得分,组织,项目,新增star,新增contributor,fork,new_pr,close_pr,new_issues,close_issues,pr_comment,issue_comment,date_from,date_to,record_date`
    );
  },
  // 英文
  startEn: function (content) {
    console.log(content);
    // write files
    content = content.replace(/\t/g, ",");

    try {
      fs.writeFileSync("report.csv", content + "\n");
    } catch (err) {
      console.error(err);
    }
  },

  // 中文
  startZh: function (content) {
    // write files
    // need to add BOM header,see
    // https://www.zhihu.com/question/21869078/answer/350728339
    try {
      fs.writeFileSync("report-zh.csv", "\uFEFF" + content + "\n", "utf8");
    } catch (err) {
      console.error(err);
    }
  },

  // 内容
  _content: "",
  // 插入
  insert: function (
    rank,
    score,
    owner,
    repoName,
    new_stars,
    new_contributors,
    new_forks,
    new_pr,
    closed_pr,
    newIssue,
    closeIssue,
    prComment,
    issueComment,
    sinceReadable,
    toReadable,
    now
  ) {
    let content = `${rank}\t${score}\t${owner}\t${repoName}\t${new_stars}\t${new_contributors}\t${new_forks}\t${new_pr}\t${closed_pr}\t${newIssue}\t${closeIssue}\t${prComment}\t${issueComment}\t${sinceReadable}\t${toReadable}\t${now}`;
    console.log(content);
    // write files
    content = content.replace(/\t/g, ",");
    this._content = this._content + content + "\n";
  },
  // 提交
  commit: function () {
    fs.appendFile("report.csv", this._content, function (err) {
      if (err) {
        console.log(err);
      } else {
        // console.log("ok.");
      }
    });
    fs.appendFileSync("report-zh.csv", this._content, function (err) {
      if (err) {
        console.log(err);
      } else {
        // console.log("ok.");
      }
    });
  },
};

exports.weeklyScoreDAO = weeklyScoreDAO;
