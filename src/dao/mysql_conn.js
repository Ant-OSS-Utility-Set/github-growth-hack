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
    cfg = config;
    if (
      cfg != null &&
      cfg.host != null &&
      cfg.host.length > 0 &&
      cfg.user != null &&
      cfg.user.length > 0
    ) {
      conn = mysql.createConnection(cfg);
      conn.connect(function (err) {
        if (err) {
          console.log(err);
          throw err;
        }
        console.log("Connected!");
        callback();
      });
    }
  },
  getConn: function () {
    return conn;
  },
  query: function (sql) {
    return new Promise(function (resolve, reject) {
      conn.query(sql, function (err, result) {
        if (err) {
          reject(err);
        } else {
          // conn.query(sql, function (err, rows, fields) {
          //   // release
          //   conn.release();
          //pass Promise
          resolve({ err: err, rows: result });
          // });
        }
      });
    });
  },
};
