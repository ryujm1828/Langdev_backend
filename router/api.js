//frontend에게 데이터를 보내줌
const express = require('express');
const router = express.Router();
const db = require("../db/db");
const chatGPT = require("../middle/openai");
const logger = require('../log/logger');
const requestIp = require("request-ip");    //get ip
const redisdb = require('../db/redisdb');
//const redisdb = require("../db/redisdb")
const reportShow = 1;       //신고 헀을 때 안보이는 기준. (reportShow 이상으로 신고받으면 안보임)

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
            console.log(rows)
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
    //    res.send({id : req.user});
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

//post 제목,내용 전송
router.get("/post/:id",function(req,res){
    let params = [reportShow,req.params.id];
    db.query(`SELECT title,content,postDate,editDate,tab,category,isBest,views,authorId
    FROM POST
    LEFT JOIN (
        SELECT postId
        FROM REPORTS
        GROUP BY postId
        HAVING COUNT(*) >= 1
    ) AS filtered_reports ON POST.postId = filtered_reports.postId
    WHERE filtered_reports.postId IS NULL AND POST.postId = 2`,params,function(err,rows){
        if(err) logger.error(err);
        else if(rows.length == 0){
            res.status(404).send('not found');
        }
        else{
            params = [req.params.id]
            db.query(`UPDATE POST SET views = views + 1 WHERE postId = ?`,params,(err1)=>{
            if(err1){
                logger.error(err1)
            }
            
            db.query(`SELECT nickname FROM USERS WHERE userId = ?`,[rows[0].authorId],(err2,nickname)=>{
                if(err2) console.log(err2)
                console.log(nickname);
                rows[0].nickname = nickname[0].nickname;
                res.send(rows[0]);
            })
            
            })
        }
    })
    
    
})

router.get("/board/list/all",function(req,res){
    let page = 1;//req.query.page;
    const postnum = 20;    //불러올 게시글 개수
    page = Number(page);
    if(page < 1){
        page = 1;
    }
    const params = [reportShow,page-1,postnum];
    db.query(`
    SELECT title, content, POST.postId, authorid, tab, category, isBest
    FROM POST
    LEFT JOIN (
        SELECT postId
        FROM REPORTS
        GROUP BY postId
        HAVING COUNT(*) >= ?
    ) AS filtered_reports ON POST.postId = filtered_reports.postId
    WHERE filtered_reports.postId IS NULL
    ORDER BY POST.postId DESC LIMIT ?,?
   `,params, function(err,rows){
        if(err) console.log(err);
        else{
            res.send(rows);
            //게시글 목록 전송
        }
    });
})

router.get("/board/list/best",function(req,res){
    const tab = req.query.tab;
    let page = 1;//req.query.page;
    const postnum = 20;    //불러올 게시글 개수
    page = Number(page);
    if(page < 1){
        page = 1;
    }
    const params = [reportShow, page-1,postnum];
    db.query(`SELECT title, content, POST.postId, authorid, tab,category,isBest 
    FROM POST 
    LEFT JOIN (
        SELECT postId
        FROM REPORTS
        GROUP BY postId
        HAVING COUNT(*) >= ?
    ) AS filtered_reports ON POST.postId = filtered_reports.postId
    WHERE filtered_reports.postId IS NULL AND Post.isBest = true
    ORDER BY POST.postId DESC LIMIT ?,?
    `,params,function(err,rows){
        if(err) logger.error(err);   

        res.send(rows);
        //게시글 목록 전송
    });
})

router.get("/board/list/:category",function(req,res){
    const tab = req.query.tab;
    let page = 1;//req.query.page;
    const postnum = 20;    //불러올 게시글 개수
    page = Number(page);
    if(page < 1){
        page = 1;
    }
    if(!req.body.tab){
        let params = [req.params.category,page-1,postnum];
        db.query(`SELECT title, content,postId, authorid,tab,category,isBest FROM POST WHERE category = ? ORDER BY postId DESC LIMIT ?,?`,params,function(err,rows){
            if(err) logger.error(err);   

            res.send(rows);
            //게시글 목록 전송
        });
    }
    else{
        let params = [req.params.category,req.body.tab,page-1,postnum];
        db.query(`SELECT title, content,postId, authorid,tab,category,isBest FROM POST WHERE category = ? AND TAB = ? ORDER BY postId DESC LIMIT ?,?`,params,function(err,rows){
            if(err) logger.error(err);   

            res.send(rows);
            //게시글 목록 전송
        });
    }
    
})

//댓글 목록 가져오기
router.get("/comment/list/:postId",function(req,res){
    const params = [req.params.postId];
    db.query(`SELECT USERS.Githubid, COMMENT.comment
    FROM COMMENT
    INNER JOIN USERS
    ON COMMENT.postId = ?`,params,function(err,rows){
      if(err) console.log(err);
      else if(rows.length == 0){
        res.status(404).send('not found');
      }
      else{
        res.send(rows);
      }
    })
});

const bestLike = 1;

router.post("/:postID/like",function(req,res){
    if(req.isAuthenticated()){
        const params = [req.user,req.params.postID];
        db.query(`
        SELECT *
        FROM LIKES
        WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? LIMIT 1;`,params,function(err1,rows){
            console.log(rows)
            if(err1)
                logger.error(`DB ERROR : ${err1}`);
            if(rows.length == 0){
                
                db.query(`INSERT
                        INTO
                        LIKES
                        (authorId, postId)
                        VALUES 
                        ((SELECT userId FROM USERS WHERE numId = ?),?)
                `,params,function(err2){
                    if(err2)
                        logger.error(`DB ERROR : ${err2}`);
                    db.query(`SELECT * FROM DISLIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? LIMIT 1`,params,function(err3,rows2){
                        if(err3)
                           logger.error(`DB ERROR : ${err3}`);
                        if(rows2.length != 0){
                            db.query(`DELETE FROM DISLIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? LIMIT 1`,params,function(err4){
                                if(err4)
                                    logger.error(`DB ERROR : ${err4}`);
                            })
                        }
                    })
                })
            }
            else{
                db.query(`DELETE FROM LIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? LIMIT 1`,params,function(err2){
                    if(err2){
                        logger.error(`DB ERROR : ${err2}`);
                        res.status(500);
                    }
                });
            }
        })
    }
    else
        res.status(400);
    res.status(200);
})

router.post("/:postID/dislike",function(req,res){
    if(req.isAuthenticated()){
        let params = [req.user,req.params.postID];
        db.query(`SELECT * FROM DISLIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? LIMIT 1`,params,function(err1,rows){ 
            if(err1)
                logger.error(`DB ERROR : ${err1}`);
            if(rows.length == 0){
                db.query(`INSERT
                INTO
                DISLIKES
                (authorId, postId)
                VALUES 
                ((SELECT userId FROM USERS WHERE numId = ?),?)
                `,params,function(err2){
                    if(err2)
                        logger.error(`DB ERROR : ${err2}`);
                    db.query(`SELECT * FROM LIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? LIMIT 1`,params,function(err3,rows2){
                        if(err3)
                            logger.error(`DB ERROR : ${err3}`);
                        if(rows2.length != 0){
                            db.query(`DELETE FROM LIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? LIMIT 1`,params,function(err4){
                                if(err4)
                                    logger.error(`DB ERROR : ${err4}`);
                            })
                        }
                    })
                })
                
            }
            else{
                db.query(`DELETE FROM DISLIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? LIMIT 1`,params,function(err2){
                    if(err2){
                        logger.error(`DB ERROR : ${err2}`);
                        res.status(500);
                    }
                                
                });
            }
        } 
        )
    }
    else
        res.status(400);
    res.status(200);
})


const cost = 10;        //chatGPT 이용 cost

router.get("/:postId/likescount",function(req,res){
    let params = [req.params.postId];
    db.query(`SELECT COUNT(*) AS count FROM LIKES WHERE postId = ?`,params,function(err,likerow){
        if(err){
            logger.error(`DB ERROR : ${err}`);
            res.status(404);
        }
        db.query(`SELECT COUNT(*) AS count FROM DISLIKES WHERE postId = ?`,params,function(err2,dislikerow){
            if(err2){
                logger.error(`DB ERROR : ${err2}`);
                res.status(404);
            }
            //인기글
            db.query(`SELECT isBest FROM POST WHERE postId = ? LIMIT 1`,params,(err3,rows)=>{
                if(err3){
                    logger.error(err3);
                    res.status(404);
                }
                else if(rows.length == 0)
                    res.status(404)
                else{
                    if(parseInt(likerow[0].count)-parseInt(dislikerow[0].count) >= bestLike && rows[0].isBest == 0){
                        db.query(`UPDATE POST SET isBest = 1 WHERE postId = ?`,params,function(err4){
                            if(err4){
                                logger.error(`DB Error : ${err4}`)
                            }
                            const params2 = [req.params.postId,req.params.postId,null,2]
                            db.query(`INSERT 
                                INTO 
                                NOTIFICATIONS(userNumId,postId,commentId,alarmType,notificationDate)
                                VALUES
                                ((SELECT numId FROM USERS WHERE userId = (SELECT authorId FROM POST WHERE postId = ?)),?,?,?,NOW())
                                `,params2,(err5,results)=>{
                                    if(err5) logger.error(err5)
                                })
                        })
                    }
                    else if(parseInt(likerow[0].count)-parseInt(dislikerow[0].count) < bestLike && rows[0].isBest == 1){
                        db.query(`UPDATE POST SET isBest = 0 WHERE postId = ?`,params,function(err4){
                            if(err4){
                                logger.error(`DB Error : ${err4}`)
                            }
                        })
                    }
                    res.json({likescount : likerow[0].count,dislikescount : dislikerow[0].count});
                }
                
            })
            
        })
        
    })
})

const removeReport = 1;

router.post("/:postID/reportPost",function(req,res){
    if(req.isAuthenticated()){
        let params = [req.user,req.params.postID];
        //신고 이미 했는지 확인
        db.query(`SELECT * FROM REPORTS WHERE userId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? LIMIT 1`,params,function(err1,rows){ 
            if(err1)
                logger.error(`DB ERROR : ${err1}`);
            if(rows.length == 0){
                //신고 처리
                db.query(`INSERT
                INTO
                REPORTS
                (userId, postId)
                VALUES 
                ((SELECT userId FROM USERS WHERE numId = ?),?)
                `,params,function(err2){
                    if(err2){
                        logger.error(`DB ERROR : ${err2}`);
                        res.status(404);
                    }
                })
                        
            }
            else{
                res.status(300);
            }
               
        })
    }
    else
        res.status(400);

    res.status(201)
})

router.get("/notification/list",function(req,res){
    if(req.isAuthenticated()){
        const params = [req.user]
        db.query("SELECT postId,commentId,alarmType,notificationDate,notificationId FROM NOTIFICATIONS WHERE userNumId = ? ORDER BY notificationDate DESC",params,(err,rows)=>{
            if(err) logger.error(err)
            else{
                if(rows.length == 0)
                    res.send(null);
                else
                    res.send(rows);
            }
        })
    }
    else
        res.send(null)
})

router.delete("/notification/delete",function (req,res){
    if(req.isAuthenticated()){
        const params = [req.user,req.params.notificationId];
        db.query(`DELETE FROM NOTIFICATIONS WHERE userNumId = ? AND notificationId = ? `,(err){
            if(err) logger.error(err);
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

module.exports = router;