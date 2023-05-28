//frontend에게 데이터를 보내줌
const express = require('express');
const router = express.Router();
const db = require("../db/db");
const chatGPT = require("../middle/openai");
const logger = require('../log/logger');
const requestIp = require("request-ip");    //get ip
const redisdb = require('../db/redisdb');
//const redisdb = require("../db/redisdb")
const category = require('./board/category');
const ik = require('./board/ik');
const best = require('./board/best')

//게시판 목록
router.use('/ik',ik);
router.use('/best',best);


router.get('/redis', (req,res)=>{
    redisdb.keys('*',(err,keys)=>{
        console.log(keys)
        res.send(keys)
    })
})

//개인정보 동의
router.post('/agree', (req,res)=>{
    console.log(req.body)
    if(!req.isAuthenticated())
        res.redirect("/")
    else{
        const params = [req.user]
        db.query("UPDATE USERS SET isagree = 1 WHERE numId = ?",params,(err)=>{
            if(err)
                logger.error(`DB ERROR : ${err}`)
            res.status(200).redirect("/")
        })
        
    }
})

router.get("/isagree", (req,res)=>{
    let params = [req.user]
    
    if(!req.isAuthenticated()){
        res.send({isagree : 1})
    }
    else{
        db.query(`SELECT isAgree FROM USERS WHERE numID = ? LIMIT 1`,params, function(err,rows){
            console.log("isagree")
            if(rows[0].isAgree == 0)
              res.send({isagree : 0})
            else
              res.send({isagree : 1})
              
        })
    }
})


//id 전송
router.get('/id', (req, res) => {
    if(!req.user || !req.isAuthenticated()){
        res.send({numId : null});
    }
    else
        res.send({numId : req.user});
});

//닉네임 전송
router.get('/nickname', (req,res)=>{
    if(!req.user || !req.isAuthenticated() ){
        res.send({nickname : null});
    }
    else{
        const params = [req.user];
        db.query(`SELECT nickname FROM USERS WHERE numId = ?`,params, function(err,rows){
            res.send({nickname : rows[0].nickname});
        });
    }
})

router.get('/nickname/:id', (req,res)=>{
    const params = [req.params.id];
    db.query(`SELECT nickname FROM USERS WHERE userId = ?`,params, function(err,rows){
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
        db.query(`SELECT NICKNAME FROM USERS WHERE numId = ?`,params, function(err,rows){
        res.send({githubid : rows[0].GITHUBID});
        });
    }
})

router.get("/notification/list",function(req,res){
    console.log("dd")
    if(req.isAuthenticated()){
        const params = [req.user]
        db.query("SELECT postId,commentId,alarmType,notificationDate FROM NOTIFICATIONS WHERE userId = ?",params,(err,rows)=>{
            if(err) logger.error(err)
            else{
                res.send(rows);
            }
        })
    }
    else{
        res.send(null)
    }
})

router.post("/notification/delete",function (req,res){
    if(req.isAuthenticated()){
        const params = [req.user,req.body.notificationId];
        db.query(`DELETE FROM NOTIFICATIONS WHERE userNumId = ? AND notificationId = ? `,params,(err,result)=>{

            if(err){
                logger.error(err);
                res.status(404);
            }
            else
                res.redirect("/")
        })
    }
    else{
        res.status(404);
    }
})

router.delete("/notification/deleteAll",function(req,res){
    if(req.isAuthenticated()){
        const params = [req.user]
        db.query(`DELETE FROM NOTIFICATIONS WHERE userNumId = ?`,params,(err)=>{
            if(err){
                logger.error(err)
                res.status(404)
            }
            else{
                res.status(200)
            }
        })
    }
    else
        res.send(null)
})


//chatGPT 답변 전송
router.post("/chatGPT",function(req,res){
    const comment = req.body.comment;
    const ip = requestIp.getClientIp(req);
    
    //권한이 있을 때
    if(req.isAuthenticated()){
        //test 전송
        if(comment != ""){
            console.log(`comment : ${comment}`);
            chatGPT(comment,function(result){
            console.log(`result : ${result}`);
                res.send({gpt : result.replaceAll('<','&lt;').replaceAll('>','&gt;')});
            });
        }
        else{
            res.send({gpt : "빈칸입력은 안되오"})
        }
        
        
        //포인트 확인
        /*
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
        */
    }
    else{
        res.send({gpt : "로그인 후 이용해주세요 :)"});
    }
})

router.use('/:category',category);

module.exports = router;