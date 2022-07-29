const sender = require("./dao/dingtalk");

sender.sendMarkdown(
  [
    // "https://oapi.dingtalk.com/robot/send?access_token=Your group token",
  ],
  "The message content \n",
  "title",
  null,
  true
);
