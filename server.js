require('dotenv').config();
const express = require("express");
const session = require("express-session");
const app = express();
const front_path = "../community_frontend/community_frontend/build";
//const front_path = "./community_frontend/community_frontend/build";  //frontend path for lim
const MySQLStore = require('express-mysql-session')(session);    //MYSQL sessionstore
const RedisStore = require("connect-redis").default
const db = require("./db/db");                          //db
const passports = require("./db/passports"); 
const passport = require("passport");
const cors = require('cors');
const logger = require('./log/logger');
const PORT = 5000;
const requestIp = require("request-ip");    //get ip
const path = require("path");
const api = require("./router/api");
const auth = require("./router/auth");
const board = require("./router/board");
const routing = require("./router/routing");
const redisdb = require("./db/redisdb")


//communication with frontend
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(express.static("../"+__dirname));
app.use(express.static(path.join(__dirname, front_path)));

//connect db
db.connect();

redisdb.on("connect",()=>{
  logger.info("Redis connect");
})
redisdb.on('error', (err) => {
  console.log(err)
  logger.error('Redis: ' + err)+'\n';
});

redisdb.connect().then()

const sessionStore = new RedisStore({client: redisdb})

//session setting
app.use(session({
  store: sessionStore,
  secret: "TEMPSECRET",     //secret
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false}  //정식에선 true로 바꿔야됨 (https 사용여부)
}));

//passport initializion and connect session, connect passport
app.use(passport.initialize());
app.use(passport.session());
passports();

//log
app.use("/",function(req,res,next){
  logger.info(`${req.method} / (${requestIp.getClientIp(req)}) id : ${req.user} enter ${req.url}`);
  
  next();
})

//routing
app.use('/',board);   //게시판 관련 라우팅
app.use('/',routing); //잡다한 것들 라우팅
app.use('/api',api);  //api(프론트와 통신) 라우팅
app.use('/auth',auth);//로그인 관련 라우팅

//리액트연동
app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, front_path+"/index.html"));
});

//서버 실행
app.listen(PORT, function(){
  logger.info(`Server listening on port ${PORT}`);
  //console.log(`Server listening on port ${PORT}`);
})