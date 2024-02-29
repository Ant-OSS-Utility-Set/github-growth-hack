const fetch = require("node-fetch");
//其他IM发送client

const otherim = {
 send : function (group, newContent, uidArr, isAtAll) {
},

sendMarkdown : function (group,title,content,uidArr,isAtAll){
}
};


module.exports = {
    otherim() {
        return otherim;
    }
};