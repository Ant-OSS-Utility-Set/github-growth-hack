const sender = require("./dao/dingtalk");

sender.sendMarkdown(
  [
    // "https://oapi.dingtalk.com/robot/send?access_token=Your group token",
  ],
  "@uid1 @uid2 Hi, 关于应用集成 Layotto，进展如何了呀，有遇到啥问题么？ \n",
  "title",
  ["uid1","uid2"],
  true
);
