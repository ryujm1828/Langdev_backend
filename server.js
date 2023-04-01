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


//메인 화면
app.get("/", function(req,res){
  
  if(req.user){
    logger.info('GET /');
    console.log(req.user);
    res.send(`Hello ${req.user}`)
    console.log(req.user);
  }
  else{
    logger.info('GET ip : /');
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
  console.log("logout");
  logger.info(`'LOGOUT user : ${req.user.id}/'`);
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
    logger.info(`'LOGIN user : ${req.user.id}/'`);
    // Successful authentication, redirect home.
    res.redirect('/');
});

//로그아웃 테스트용
app.get('/login', (req, res) => res.send(`<form action="http://localhost:8080/logout" method="post"><p>
<input type="submit">
</p></form>`));

//글쓰기 처리
const board_list = ["jayu","ik","qna"];

app.post("/:board/write_process", function (req, res) {
  //board가 없을 때 혹은 로그인이 안되어 있을 때 혹은 권한이 없을 때
  if(board_list.includes(req.params.board) == false || req.user == false){
    res.status(404).send('not found');
  } else {
    //글쓰기
  }
});

app.post("/:board/update_process",function (req, res) {
  //board가 없을 때 혹은 다른 유저 일 때
  if(board_list.includes(req.params.board) == false || req.user != db.query("")){
    res.status(404).send('not found');
  } else {
    //수정
  }
});

/*
//리액트연동
app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, front_path));
});
*/

app.listen(PORT, function(){
  logger.info(`Server listening on port ${PORT}`);
  console.log(`Server listening on port ${PORT}`);
})