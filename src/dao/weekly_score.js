const fs = require("fs");
const { getConn } = require("./mysql_conn");

const weeklyScoreDAO = {
  start: function () {
    fsDAOImpl.start();
    mysqlDAOImpl.start();
  },
  insert: function (
    rank,
    score,
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
    fsDAOImpl.insert(
      rank,
      score,
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
    mysqlDAOImpl.insert(
      rank,
      score,
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
  commit: function () {
    fsDAOImpl.commit();
    mysqlDAOImpl.commit();
  },
};
const mysqlDAOImpl = {
  start: function () {},
  insert: function (
    rank,
    score,
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
    let conn = getConn();
    if (conn == null) {
      // console.log("mysql connection is null");
      return;
    }
    sql =
      `INSERT INTO \`github_repo_weekly\` (\`date_from\`, \`date_to\`, \`record_date\`, \`rank\`, \`score\`, \`owner\`, \`project\`, \`new_stars\`, \`new_contributors\`, \`new_forks\`, \`new_pr\`, \`closed_pr\`, \`new_issues\`, \`closed_issues\`, \`pr_comment\`, \`issue_comment\`)` +
      ` VALUES ("${sinceReadable}","${toReadable}","${now}"` +
      `,${rank},${score}` +
      `,null,"${repoName}"` +
      `,${new_stars},${new_contributors},${new_forks}` +
      `,${new_pr},${closed_pr}` +
      `,${new_issues},${closed_issues}` +
      `,${pr_comment},${issue_comment})`;
    conn.query(sql, function (err, result) {
      if (err) {
        console.log(err);
        throw err;
      }
      // console.log("Result: " + result);
    });
  },
  commit: function () {
    let conn = getConn();
    if (conn == null) {
      // console.log("mysql connection is null");
      return;
    }
    // conn.commit(function (err) {
    //   console.log(err);
    // });
    conn.end();
  },
};
const fsDAOImpl = {
  start: function () {
    this.startEn(
      `rank\tscore\tproject\tnew_stars\tnew_contributors\tnew_forks\tnew_pr\tclosed_pr\tnew_issues\tclosed_issues\tpr_comment\tissue_comment\tdate_from\tdate_to\trecord_date`
    );
    this.startZh(
      `排名,活跃度得分,项目,新增star,新增contributor,fork,new_pr,close_pr,new_issues,close_issues,pr_comment,issue_comment,date_from,date_to,record_date`
    );
  },
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

  _content: "",
  insert: function (
    rank,
    score,
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
    let content = `${rank}\t${score}\t${repoName}\t${new_stars}\t${new_contributors}\t${new_forks}\t${new_pr}\t${closed_pr}\t${newIssue}\t${closeIssue}\t${prComment}\t${issueComment}\t${sinceReadable}\t${toReadable}\t${now}`;
    console.log(content);
    // write files
    content = content.replace(/\t/g, ",");
    this._content = this._content + content + "\n";
  },
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
