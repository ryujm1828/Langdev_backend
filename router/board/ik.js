const express = require('express');
const router = express.Router();
const cleanxss = require("../../middle/sanitizer");
const db = require("../../db/db");
const reportShow = 1;       //신고 헀을 때 안보이는 기준. (reportShow 이상으로 신고받으면 안보임)
var blank_pattern = /^\s+|\s+$/g;
const requestIp = require("request-ip");    //get ip
const logger = require('../../log/logger')

router.get("/list",function(req,res){
    console.log("ik")
    let page = 1; //req.query.page;
    const postnum = 20;    //불러올 게시글 개수
    page = Number(page);
    
    if(page < 1){
        page = 1;
    }
    
    let params = [page-1,postnum];
    db.query(`SELECT title, content, postId FROM POST where category = 'ik' ORDER by postDate DESC LIMIT ?,?`,params,function(err,rows){
        console.log("ik")
        if(err){
            logger.error(err);
            res.status(404)
        }    
        else{
            res.send(rows);
        }
        //게시글 목록 전송
    });
})

router.post("/write",function (req,res){
    const ip = requestIp.getClientIp(req);
    const title = cleanxss(req.body.title);
    const content = cleanxss(req.body.content);
    console.log(`title : ${title} content : ${content} user : ${req.user}`);
    //title,content
    //board가 없을 때 혹은 로그인이 안되어 있을 때 혹은 권한이 없을 때
    if(!req.isAuthenticated()  || content.replace(blank_pattern, '') == '' || title.replace(blank_pattern, '') == ''){
      logger.info(`${req.method} / ip : ${ip} id : ${req.user} try post but fail $`);
      res.status(400);
    } else {
        //글 작성
        let tab = 'tempTab'
        const params = [title, content, req.user,tab];
        let insertid;
        db.query(`INSERT 
        INTO
        POST(title, content, authorId, postDate, editDate, category,tab)
        VALUES
        (?,?,(SELECT userId FROM USERS WHERE numId = ? LIMIT 1),NOW(),NOW(),'ik',?);`,params,
        function(err,rows){
            console.log(rows)
            if(err){
                logger.error(err)
                res.status(404)
            } 
            else{
                insertid = rows.insertId;
                logger.info(`${req.method} / ip : ${ip} id : ${req.user} postid ${insertid} complete`);
                res.status(200)
            }
        });
      //글쓰기
    }
})

router.post("/delete/:id",function (req,res){
    if(req.isAuthenticated()){
        const params = [req.user,req.body.postId];
        db.query(`DELETE FROM POST WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = 'ik'`,params,(err,result)=>{
            if(err){
                logger.error(err);
                res.status(404);
            }
            else
                res.status(200);
        })
    }
    else{
        res.status(404);
    }
})

//post 제목,내용 전송
router.get("/get/:id",function(req,res){
    let params = [reportShow,req.params.id];
    db.query(`SELECT title,content,postDate,editDate,views
    FROM POST
    LEFT JOIN (
        SELECT postId
        FROM REPORTS
        WHERE category = 'ik'
        GROUP BY postId
        HAVING COUNT(*) >= ?
    ) AS filtered_reports ON POST.postId = filtered_reports.postId
    WHERE filtered_reports.postId IS NULL AND POST.postId = ? AND category = 'ik'`,params,function(err,rows){
            
        if(err){
            logger.error(err);
            res.status(404)
        }
        else if(rows.length == 0){
            res.status(404).send('not found');
        }
        else{
            params = [req.params.id]
            db.query(`UPDATE POST SET views = views + 1 WHERE postId = ?`,params,(err1)=>{
            if(err1){
                logger.error(err1)
                res.status(404)
            }
            else{
                console.log("get")
                res.send(rows[0])
            }
            })
        }
    })
})

router.post("/comment/write/:postId", async function (req, res,next) {
    const ip = requestIp.getClientIp(req);
    const content = cleanxss(req.body.content);
    console.log(`content : ${content} user : ${req.user}`);
    
    //title,content
    //board가 없을 때 혹은 로그인이 안되어 있을 때 혹은 권한이 없을 때
    if(!req.isAuthenticated() || content.replace(blank_pattern, '') == ''){
      logger.info(`${req.method} / ip : ${ip} id : ${req.user} try comment write but fail $`);
      res.status(400);
    } else {
        let params = [req.user,req.params.postId]
        let iknum = 0;

        //댓글 쓴적 있는지 확인
        await db.query(`SELECT userId, ikNum FROM COMMENT WHERE userId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? LIMIT 1`,params,(err,rows)=>{
            //없으면
            if(rows.length == 0){
                db.query(`SELECT userId FROM POST WHERE userId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? LIMIT 1`,(err,result)=>{
                    //작성자가 댓글 쓰는 경우
                    if(result.length == 1){
                        iknum = 0;
                    }
                    //새로운 사람이 댓글 쓰는 경우
                    else{
                        params = [req.params.postId]
                        db.query(`UPDATE POST SET ikNum = ikNum + 1 where postId = ?`,params,(err2)=>{
                            iknum = rows[0].ikNum + 1;
                        })
                    }
                })
                
            }
            else{
                iknum = rows[0].ikNum;
            }
        });
        
        //글 작성
        const params1 = [req.params.postId,req.user,content,iknum];
        
        let insertid;
        db.query(`INSERT 
        INTO
        COMMENT(postId, userId, comment, postDate, editDate,ikNum,category)
        VALUES
        (?,(SELECT userId FROM USERS WHERE numId = ? LIMIT 1),?,NOW(),NOW(),?,'ik');`,params1,
        function(err,rows,fields){
            console.log(rows)
            if(err) console.log(err);
            insertid = rows.insertId;
            const params2 = [req.params.postId,req.params.postId,insertid]
            logger.info(`${req.method} / ip : ${ip} id : ${req.user} postid ${insertid} complete`);
            db.query(`INSERT 
            INTO 
            NOTIFICATIONS(userNumId,postId,commentId,alarmType,notificationDate,category)
            VALUES
            ((SELECT numId FROM USERS WHERE userId = (SELECT authorId FROM POST WHERE postId = ? AND category = 'ik')) ,?,?,0,NOW(),'ik')
            `,params2,(err2,results)=>{
              console.log(results)
              if(err2) logger.error(err2)
            })
        });
      //글쓰기
    }
    console.log(req.body);
    res.redirect(`/ik/${req.params.postId}`);
});

//댓글 목록 가져오기
router.get("/comment/list/:postId",function(req,res){
    const params = [req.params.postId];
    
    db.query(`SELECT ikNum, comment, postDate,editDate
    FROM COMMENT
    WHERE postId = ? AND category = 'ik'
    `,params,function(err,rows){
    if(err){
        console.log(err);
        res.status(404)
    }
    else{
        
        console.log("comment")
        res.send(rows);
      }
    })
});

router.post("/comment/delete",function (req,res){
    if(req.isAuthenticated()){
        const params = [req.user,req.body.commentId];
        db.query(`DELETE FROM COMMENT WHERE userId = (SELECT userId FROM USERS WHERE numId = ?) AND commentId = ? AND category = 'ik'`,params,(err,result)=>{
            if(err){
                logger.error(err);
                res.status(404);
            }
            else
                res.status(200);
        })
    }
    else{
        res.status(404);
    }
})

const bestLike = 1;

router.post("/:postID/like",function(req,res){
    if(req.isAuthenticated()){
        console.log("좋아요")
        const params = [req.user,req.params.postID];
        db.query(`
        SELECT * FROM LIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? WHERE category = 'ik' LIMIT 1;`,params,function(err1,rows){
            console.log("좋아요")
            console.log(rows)
            if(err1)
                logger.error(`DB ERROR : ${err1}`);
            if(rows.length == 0){
                
                db.query(`INSERT
                        INTO
                        LIKES
                        (authorId, postId,category)
                        VALUES 
                        ((SELECT userId FROM USERS WHERE numId = ?),?,ik)
                `,params,function(err2){
                    if(err2)
                        logger.error(`DB ERROR : ${err2}`);
                    db.query(`SELECT * FROM DISLIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? category = ik LIMIT 1`,params,function(err3,rows2){
                        if(err3)
                           logger.error(`DB ERROR : ${err3}`);
                        if(rows2.length != 0){
                            db.query(`DELETE FROM DISLIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = ik LIMIT 1`,params,function(err4){
                                if(err4)
                                    logger.error(`DB ERROR : ${err4}`);
                            })
                        }
                    })
                })
            }
            else{
                db.query(`DELETE FROM LIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = 'ik' LIMIT 1`,params,function(err2){
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
        db.query(`SELECT * FROM DISLIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = 'ik' LIMIT 1`,params,function(err1,rows){
            if(err1)
                logger.error(`DB ERROR : ${err1}`);
            if(rows.length == 0){
                db.query(`INSERT
                INTO
                DISLIKES
                (authorId, postId,category)
                VALUES 
                ((SELECT userId FROM USERS WHERE numId = ?),?,'ik')
                `,params,function(err2){
                    if(err2)
                        logger.error(`DB ERROR : ${err2}`);
                    db.query(`SELECT * FROM LIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? LIMIT 1`,params,function(err3,rows2){
                        if(err3)
                            logger.error(`DB ERROR : ${err3}`);
                        if(rows2.length != 0){
                            db.query(`DELETE FROM LIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = 'ik' LIMIT 1`,params,function(err4){
                                if(err4)
                                    logger.error(`DB ERROR : ${err4}`);
                            })
                        }
                    })
                })
                
            }
            else{
                db.query(`DELETE FROM DISLIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = 'ik' LIMIT 1`,params,function(err2){
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
    db.query(`SELECT COUNT(*) AS count FROM LIKES WHERE postId = ? AND category = 'ik'`,params,function(err,likerow){
        if(err){
            logger.error(`DB ERROR : ${err}`);
            res.status(404);
        }
        db.query(`SELECT COUNT(*) AS count FROM DISLIKES WHERE postId = ? AND category = 'ik'`,params,function(err2,dislikerow){
            if(err2){
                logger.error(`DB ERROR : ${err2}`);
                res.status(404);
            }
            else{
                console.log("likescount")
                res.json({likescount : likerow[0].count,dislikescount : dislikerow[0].count});
            }
            
        })
        
    })
})

const removeReport = 1;

router.post("/:postID/reportPost",function(req,res){
    if(req.isAuthenticated()){
        let params = [req.user,req.params.postID];
        //신고 이미 했는지 확인
        db.query(`SELECT * FROM REPORTS WHERE userId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = 'ik' LIMIT 1`,params,function(err1,rows){ 
            if(err1)
                logger.error(`DB ERROR : ${err1}`);
            if(rows.length == 0){
                //신고 처리
                db.query(`INSERT
                INTO
                REPORTS
                (userId, postId,category)
                VALUES 
                ((SELECT userId FROM USERS WHERE numId = ?),?,'ik')
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

module.exports = router