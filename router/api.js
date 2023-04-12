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
        res.send(null);
    }
    else{
        const params = [req.user];
        db.query(`SELECT NICKNAME FROM USERS WHERE ID = ?`,params, function(err,rows){
            
            res.send({nickanme : rows[0].NICKNAME});
        });
    }
})

//githubid 전송
router.get('/githubid', (req,res)=>{
    if(!req.user || !req.isAuthenticated() ){
        res.send(null);
    }
    else{
        const params = [req.user]
        db.query(`SELECT NICKNAME FROM USERS WHERE ID = ?`,params, function(err,rows){
        res.send({githubid : rows[0].GITHUBID});
        });
    }
})

//board 제목,내용 전송
router.get("/board/:id/title",function(req,res){
    const params = [req.params.id];
    db.query(`SELECT * FROM BOARD WHERE PostID = ?`,params,function(err,rows){
      if(err) console.log(err);
      
      else if(rows.length == 0){
        res.status(404).send('not found');
      }

      else{
        const titlevalue = rows[0].Title;
        res.send({title : titlevalue});
      }
    })
})

router.get("/board/:id/content",function(req,res){
    const params = [req.params.id];
    db.query(`SELECT * FROM BOARD WHERE PostID = ?`,params,function(err,rows){
      if(err) console.log(err);
      
      else if(rows.length == 0){
        res.status(404).send('not found');
      }

      else{
        const contentvalue = rows[0].Content;
        res.send({content : contentvalue});
      }
    })
})

router.get("/:board/list",function(req,res){
    const params = [req.params.board];
    const tab = req.query.tab;
    const page = req.query.page;
    const boardnum = 20;    //불러올 게시글 개수
    db.query(`SELECT Title, POSTID, USERS_ID FROM BOARD WHERE BOARDNAME = ? OERDER BY POSTID DESC LIMIT ${(req.params.page-1)*20}, ${boardnum}`,params,function(err,rows){
        //게시글 목록 전송
    });
})

const cost = 10;        //chatGPT 이용 cost

//chatGPT 답변 전송
router.get("/api/chatGPT",function(req,res){
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