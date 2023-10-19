var mysql = require("mysql");

var cfg = {
  host: "",
  user: "",
  password: "",
  database: "",
};
var conn;

module.exports = {
  setConfig: function (config, callback) {
    // 设置配置
    cfg = config;
    // 校验Mysql
    if (
      cfg != null &&
      cfg.host != null &&
      cfg.host.length > 0 &&
      cfg.user != null &&
      cfg.user.length > 0
    ) {
      // 创建连接
      conn = mysql.createConnection(cfg);
      // 连接数据库
      conn.connect(function (err) {
        if (err) {
          console.log(err);
          throw err;
        }
        console.log("Mysql connected!");
        callback();
      });
    } else {
      console.log("no mysql config!");
      callback();
    }
  },
  getConn: function () {
    // 获取连接
    return conn;
  },
  query: function (sql) {
    return new Promise(function (resolve, reject) {
      // 判断数据库连接是否为空
      if (conn == null) {
        // 如果为空，则返回错误信息为null，行数为空数组
        resolve({ err: null, rows: [] });
        return;
      }
      // 执行sql语句
      conn.query(sql, function (err, result) {
        // 如果有错误，则返回错误信息
        if (err) {
          reject(err);
        } else {
          // conn.query(sql, function (err, rows, fields) {
          //   // release
          //   conn.release();
          //pass Promise
          //   // 返回错误信息，行数，字段
          resolve({ err: err, rows: result });
          // });
        }
      });
    });
  },
};