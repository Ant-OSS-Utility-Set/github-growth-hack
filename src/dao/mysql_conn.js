var mysql = require("mysql");

var cfg = {
  host: "",
  user: "",
  password: "",
  database: "",
};
var conn;

module.exports = {
  setConfig: function (config) {
    cfg = config;
  },
  getConn: function () {
    if (
      conn == null &&
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
      });
    }
    return conn;
  },
};
