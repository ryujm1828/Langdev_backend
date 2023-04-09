require('dotenv').config();
const express = require("express");
const app = express();
const session = require("express-session");
const front_path = "../community_frontend/community_frontend/build";  //frontend path for ryu
//const front_path = "./community_frontend/community_frontend/build";  //frontend path for lim
const MySQLStore = require('express-mysql-session')(session);    //MYSQL sessionstore
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

//communication with frontend
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(express.static("../"+__dirname));
app.use(express.static(path.join(__dirname, front_path)));

//connect db
db.connect();

//sessionstore options
const storeOptions = {
  host : process.env.STORE_HOST,
  port : 3306,
  user : process.env.STORE_USER,
  password: process.env.STORE_PASSWORD,
  database: process.env.STORE_DATABASE,
}
const sessionStore = new MySQLStore(storeOptions);

//session setting
app.use(session({
  secret: "TEMPSECRET",     //secret
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false},  //정식에선 true로 바꿔야됨 (https 사용여부)
  store: sessionStore
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