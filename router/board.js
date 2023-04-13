//게시판 관련 작업들
const express = require('express');
const router = express.Router();
const db = require("../db/db");
const requestIp = require("request-ip");    //get ip
const board_list = ["jayu","ik","security","board"];    //게시판 리스트
const cleanxss = require("../middle/sanitizer");

//const sanitizer = require("../middle/sanitizer");
const logger = require('../log/logger');

//write
router.post("/:board/write_process", function (req, res,next) {
    const ip = requestIp.getClientIp(req);
    const title = cleanxss(req.body.title);
    const content = cleanxss(req.body.content);
    console.log(`title : ${title} content : ${content} user : ${req.user}`);
    //title,content
    //board가 없을 때 혹은 로그인이 안되어 있을 때 혹은 권한이 없을 때
    if(board_list.includes(req.params.board) == false || !req.isAuthenticated()){
      logger.info(`${req.method} / ip : ${ip} id : ${req.user} try post but fail $`);
      //res.status(404).send('not found');
    } else {
        //글 작성
        const params = [title, content, req.user,'TABS',req.params.board];
        let insertid;
        db.query(`INSERT 
        INTO
        POST(title, content, authorId, tab, category, postDate, editDate)
        VALUES
        (?,?,?,?,?,NOW(),NOW());`,params,
        function(err,rows,fields){
            if(err) console.log(err);
            insertid = rows.insertId;
            logger.info(`${req.method} / ip : ${ip} id : ${req.user} postid ${insertid} complete`);
        });
      //글쓰기
    }
    res.redirect(`/${req.params.board}`);
});
  
//update
router.post("/:board/update_process",function (req, res) {
    const ip = requestIp.getClientIp(req);
    const title = cleanxss(req.body.title);
    const content = cleanxss(req.body.content);
    
    //board가 없을 때 혹은 다른 유저 일 때
    if(board_list.includes(req.params.board) == false || req.user != db.query("") || !req.isAuthenticated()){
      logger.info(`${req.method} / ip : ${ip} id : ${req.user} try update but fail $`);
      res.status(404).send('not found');
    } else {
      logger.info(`${req.method} / ip : ${ip} id : ${req.user} update $ complete`);
      //수정
    }
});

module.exports = router;