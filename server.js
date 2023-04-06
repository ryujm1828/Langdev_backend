require('dotenv').config();
const express = require("express");
const app = express();
const session = require("express-session");
const front_path = "../community_frontend/community_frontend/build";  //frontend path
const MySQLStore = require('express-mysql-session')(session);    //MYSQL sessionstore
const db = require("./db/db");                          //db
const passports = require("./db/passports");            
const passport = require("passport");
const cors = require('cors');
const logger = require('./log/logger')
const PORT = 5000;
const requestIp = require("request-ip");    //get ip
const path = require("path");

//communication with frontend
app.use(express.json());
app.use(cors({
  origin: '*', // 모든 출처 허용 옵션. true 를 써도 된다.
}));
app.use(express.urlencoded({extended:true}));
app.use(express.static("../"+__dirname));

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

//session options
app.use(session({
  secret: "TEMPSECRET",     //secret
  resave: false,
  saveUninitialized: false,
  cookie: {secure: false},  //정식에선 true로 바꿔야됨 (https 사용여부)
  store: sessionStore
}));

//passport initializion and connect session
app.use(passport.initialize());
app.use(passport.session());

//passport connect
passports();

//log
app.use("/",function(req,res,next){
  logger.info(`${req.method} / (${requestIp.getClientIp(req)}) id : ${req.user} enter ${req.url}`);
  next();
})

//test main
/*
app.get("/", function(req,res){
  if(req.user){
    console.log(req.user);
    res.send(`Hello ${req.user}`)
    console.log(req.user);
  }
  else{
    res.send("Pleas Login");
  }
})
*/
//username information send
app.get("/username", function(req,res){
  if(!req.user){
    res.send(NULL);
  }
  else{
    res.json({username : req.user});
  }
})

//board list send
app.get("/:board/list",function(req,res){
  res.send(db.query(""));
})


//logout
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

//logout test
/*
app.get('/login', (req, res) => res.send(`<form action="http://localhost:5000/logout" method="post"><p>
<input type="submit">
</p></form>`));
*/

const board_list = ["jayu","ik","security","board"];

//write
app.post("/board/write_process", function (req, res) {
  const ip = requestIp.getClientIp(req);
  const title = req.body.title;
  const content = req.body.content;
  console.log(`title : ${title} content : ${content} user : ${req.user}`);
  console.log(req);
  //title,content
  //board가 없을 때 혹은 로그인이 안되어 있을 때 혹은 권한이 없을 때
  if(board_list.includes(req.params.board) == false || !req.user){
    logger.info(`${req.method} / ip : ${ip} id : ${req.user} try post but fail $`);
    //res.status(404).send('not found');
  } else {
    logger.info(`${req.method} / ip : ${ip} id : ${req.user} post $ complete`);
    //글쓰기
  }
  res.redirect("/");
});

//update
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
app.use(express.static(path.join(__dirname, front_path)));
//리액트연동
app.get("/*", function (req, res) {
    res.sendFile(path.join(__dirname, front_path+"/index.html"));
});


app.listen(PORT, function(){
  logger.info(`Server listening on port ${PORT}`);  
  //console.log(`Server listening on port ${PORT}`);
})