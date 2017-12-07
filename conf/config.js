var server = {
        sms:'',//短信 ali 阿里 jpush 极光
        push:true,//推送
        validate:true,//验证码
        mysqldb:'default',//'default' 默认 'docker'   阿里云'ali' 
}
server.debug = 'debug';
server.ali = 'ali';

server.env = server.debug;
// server.env = server.ali;

if(server.env == server.ali){
    server.sms = 'jpush';
    server.push = true;
    server.validate = true;
    server.mysqldb = 'ali';
}else{

}

console.log('------ sever config')
console.log(server)


//配置项
module.exports = {
    server,
};