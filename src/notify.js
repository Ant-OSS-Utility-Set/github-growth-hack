const sender = require("./dao/dingtalk");

sender.sendMarkdown(
  [
    // The webhook url of your dingtalk bot. For example:
    "https://oapi.dingtalk.com/robot/send?access_token=0bf65479caed4a82735752ce39c8a9fa89e4fced2204f2e413faad81738e1d00",
  ],

  // Here's what you want your bot to say.
  // uid1 and uid2 is the users' id you want to @
  "@uid1 @uid2 Hi, 关于应用集成 Layotto，进展如何了呀，有遇到啥问题么？ \n",

  // The title of your message
  "title",

  // uid1 and uid2 is the users' id you want to @
  ["uid1", "uid2"],
  true
);
