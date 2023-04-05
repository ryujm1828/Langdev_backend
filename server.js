require('dotenv').config();
const express = require("express");
const app = express();
const session = require("express-session");
//const mysql = require("mysql");
const front_path = "../community_frontend/my-app/build/index.html";  //프론트엔드
const MySQLStore = require('express-mysql-session')(session);    //MYSQL sessionstore
const db = require("./db/db");                          //db관리
const passports = require("./db/passports");            
const passport = require("passport");
const cors = require('cors');
const logger = require('./log/logger')
const PORT = 8080;
const requestIp = require("request-ip");

//frontend로 정보 전달
app.use(express.json());
app.use(cors());

db.connect();

//sessionstore 설정
const storeOptions = {
  host : process.env.STORE_HOST,
  port : 3306,
  user : process.env.STORE_USER,
  password: process.env.STORE_PASSWORD,
  database: process.env.STORE_DATABASE,
}
const sessionStore = new MySQLStore(storeOptions);

//session 설정
app.use(session({
  secret: "TEMPSECRET",     //secret
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false},  //정식에선 true로 바꿔야됨 (https 사용여부)
  store: sessionStore
}));

//passport 초기화 및 세션 연결
app.use(passport.initialize());
app.use(passport.session());

passports();

app.use("/",function(req,res,next){
  logger.info(`${req.method} / (${requestIp.getClientIp(req)}) id : ${req.user} enter ${req.url}`);
  next();
})

//메인 화면
app.get("/", function(req,res){
  if(req.user){
    console.log(req.user);
    res.send(`Hello ${req.user}`)
    console.log(req.user);
  }
  else{
    //logger.info(`GET ip : ${ip}/`);
    res.send("Pleas Login");
  }
})

//username 리턴
app.get("/username", function(req,res){
  if(!req.user){
    res.send(NULL);
  }
  else{
    res.json({username : req.user});
  }
})

//list 리턴
app.get("/:board/list",function(req,res){
  res.send(db.query(""));
})


//로그아웃
app.post('/logout', function(req, res, next) {
  const ip = requestIp.getClientIp(req);
  logger.info(`${req.method} / ip : ${ip} id : ${req.user} logout`);
  req.session.destroy(() => {
    res.redirect('/');
  });
});

//github 로그인 처리
app.get('/auth/github', passport.authenticate('github'));
//github 로그인 데이터 받아오기
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
});

//로그아웃 테스트용
app.get('/login', (req, res) => res.send(`<form action="http://localhost:8080/logout" method="post"><p>
<input type="submit">
</p></form>`));

//글쓰기 처리
const board_list = ["jayu","ik","security"];

app.post("/:board/write_process", function (req, res) {
  const ip = requestIp.getClientIp(req);

  //board가 없을 때 혹은 로그인이 안되어 있을 때 혹은 권한이 없을 때
  if(board_list.includes(req.params.board) == false || !req.user){
    logger.info(`${req.method} / ip : ${ip} id : ${req.user} try post but fail $`);
    res.status(404).send('not found');
  } else {
    logger.info(`${req.method} / ip : ${ip} id : ${req.user} post $ complete`);
    //글쓰기
  }
});

app.post("/:board/update_process",function (req, res) {
  const ip = requestIp.getClientIp(req);
  //board가 없을 때 혹은 다른 유저 일 때
  if(board_list.includes(req.params.board) == false || req.user != db.query("")){
    logger.info(`${req.method} / ip : ${ip} id : ${req.user} try update but fail $`);
    res.status(404).send('not found');
  } else {
    logger.info(`${req.method} / ip : ${ip} id : ${req.user} update $ complete`);
    //수정
  }
});

/*
app.get("/.env", function(req,res){
  res.send("Hello Hacker?");
})
*/

/*
//리액트연동
app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, front_path));
});
*/

app.listen(PORT, function(){
  logger.info(`Server listening on port ${PORT}`);  
  //console.log(`Server listening on port ${PORT}`);
})