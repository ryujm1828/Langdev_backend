//frontend에게 데이터를 보내줌
const express = require('express');
const router = express.Router();
const db = require("../db/db");
//const chatGPT = require("../middle/openai");
const logger = require('../log/logger');
const requestIp = require("request-ip");    //get ip

//id 전송
router.get('/id', (req, res) => {
    if(!req.user || !req.isAuthenticated()){
        res.send({id : null});
    }
    else
        res.send({id : req.user});
    //    res.send({id : req.user});
});

//닉네임 전송
router.get('/nickname', (req,res)=>{
    if(!req.user || !req.isAuthenticated() ){
        res.send({nickname : null});
    }
    else{
        const params = [req.user];
        db.query(`SELECT NICKNAME FROM USERS WHERE ID = ?`,params, function(err,rows){
            
            res.send({nickname : rows[0].NICKNAME});
        });
    }
})

router.get('/nickname/:id', (req,res)=>{
    const params = [req.params.id];
    db.query(`SELECT NICKNAME FROM USERS WHERE ID = ?`,params, function(err,rows){
            res.send({nickname : rows[0].NICKNAME});
        });
    }
)

//githubid 전송
router.get('/githubid', (req,res)=>{
    if(!req.user || !req.isAuthenticated() ){
        res.send({githubid : null});
    }
    else{
        const params = [req.user]
        db.query(`SELECT NICKNAME FROM USERS WHERE ID = ?`,params, function(err,rows){
        res.send({githubid : rows[0].GITHUBID});
        });
    }
})

//board 제목,내용 전송
router.get("/board/post/:id",function(req,res){
    const params = [req.params.id];
    db.query(`SELECT * FROM BOARD WHERE postId = ?`,params,function(err,rows){
      if(err) console.log(err);
      else if(rows.length == 0){
        res.status(404).send('not found');
      }
      else{
        res.send(rows[0]);
      }
    })
})

router.get("/board/list/all",function(req,res){
    const tab = req.query.tab;
    let page = 1;//req.query.page;
    const boardnum = 20;    //불러올 게시글 개수
    page = Number(page);
    if(page < 1){
        page = 1;
    }
    const params = [page-1,boardnum];
    db.query(`SELECT title, content, postid, authorid, tab,category,isBest,good,bad FROM BOARD ORDER BY POSTID DESC LIMIT ?,?`,params, function(err,rows){
            console.log(rows);
            res.send(rows);
            //게시글 목록 전송
    });
})

router.get("/board/list/best",function(req,res){
    const tab = req.query.tab;
    let page = 1;//req.query.page;
    const boardnum = 20;    //불러올 게시글 개수
    page = Number(page);
    if(page < 1){
        page = 1;
    }
    const params = [page-1,boardnum];
    db.query(`SELECT Title, POSTID, authorid,tab,category,isBest,good,bad FROM BOARD WHERE isBest = true ORDER BY POSTID DESC LIMIT ?,?1`,params,function(err,rows){
        console.log(rows);
        res.send(rows);
        //게시글 목록 전송
    });
})

const cost = 10;        //chatGPT 이용 cost

//chatGPT 답변 전송
router.get("/chatGPT",function(req,res){
    const comment = req.body.comment;
    const ip = requestIp.getClientIp(req);
    
    //권한이 있을 때
    if(req.user && req.isAuthenticated()){
        //포인트 확인
        db.query("", function(err,rows){
            const credit = rows[0].credit;
            if(credit < 0){
                logger.error(`ip : ${ip} id : ${req.user} credit is ${credit}`)
            }
            else if(credit >= cost){
                logger.info(`ip : ${ip} id : ${req.user} use chat GPT\n Comment : ${comment}`);
                db.query("");   //credit 감소

                res.send(chatGPT(comment));
            
            }
            else{
                res.send("포인트가 부족합니다.");
            }
        })
    }
    else{
        res.send(NULL);
    }
})

module.exports = router;