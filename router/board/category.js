const express = require('express');
const router = express.Router({mergeParams: true});
const categoryList = ['jayu','security']
const db = require("../../db/db");
const requestIp = require("request-ip");    //get ip
const cleanxss = require("../../middle/sanitizer");
const reportShow = 1;       //신고 헀을 때 안보이는 기준. (reportShow 이상으로 신고받으면 안보임)
//const sanitizer = require("../middle/sanitizer");
const logger = require('../../log/logger')

var blank_pattern = /^\s+|\s+$/g;

let category = null;

router.use("/",function(req,res,next){
    if(categoryList.includes(req.params.category)){
        category = req.params.category;
        next()
    }
    else
        res.status(404);
})

router.get("/list",function(req,res){
    const tab = req.query.tab;
    let page = 1; //req.query.page;
    const postnum = 20;    //불러올 게시글 개수
    page = Number(page);
    if(page < 1){
        page = 1;
    }
   if(categoryList.includes(category)){
        if(!tab){
            let params = [category,page-1,postnum];
            db.query(`SELECT title, content,postId, authorid,tab,category,isBest FROM POST WHERE category = ? ORDER BY postId DESC LIMIT ?,?`,params,function(err,rows){
                if(err){
                    logger.error(err); 
                    res.status(404)
                }
                console.log(category)
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
    }
    else{
        res.status(404);
    }
    
})

router.post("/write",function (req,res){
    const ip = requestIp.getClientIp(req);
    const title = cleanxss(req.body.title);
    const content = cleanxss(req.body.content);
    const tab = "tab"
    console.log(`title : ${title} content : ${content} user : ${req.user}`);
    //title,content
    //board가 없을 때 혹은 로그인이 안되어 있을 때 혹은 권한이 없을 때
    if(!req.isAuthenticated()  || content.replace(blank_pattern, '') == '' || title.replace(blank_pattern, '') == ''){
      logger.info(`${req.method} / ip : ${ip} id : ${req.user} try post but fail $`);
      res.status(400);
    } else {
        //글 작성
        const params = [title, content, req.user,category,tab];
        let insertid;
        db.query(`INSERT 
        INTO
        POST(title, content, authorId, postDate, editDate,category,tab)
        VALUES
        (?,?,(SELECT userId FROM USERS WHERE numId = ? LIMIT 1),NOW(),NOW(),?,?);`,params,
        function(err,rows,fields){
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
        const params = [req.user,req.body.postId,category];
        db.query(`DELETE FROM POST WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = ?`,params,(err,result)=>{
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
    if(categoryList.includes(req.params.category)){
        let params = [category,reportShow,req.params.id,category];
        db.query(`SELECT title,content,postDate,editDate,tab,category,isBest,views,authorId
        FROM POST
        LEFT JOIN (
            SELECT postId
            FROM REPORTS
            WHERE CATEGORY = ?
            GROUP BY postId
            HAVING COUNT(*) >= ?
        ) AS filtered_reports ON POST.postId = filtered_reports.postId
        WHERE filtered_reports.postId IS NULL AND POST.postId = ? AND POST.category = ?`,params,function(err,rows){
            
            if(err) logger.error(err);
            
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
                    params = [req.params.id,category]
                    db.query(`SELECT nickname FROM USERS WHERE userId = ?`,[rows[0].authorId],(err2,nickname)=>{
                        if(err2){
                            console.log(err2)
                        }
                        console.log(nickname);
                        rows[0].nickname = nickname[0].nickname;
                        res.send(rows[0]);
                    })
                }
                })
            }
        })
    }
    else{
        res.status(404)
    }
})

//댓글 작성
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
        //글 작성
        const params1 = [req.params.postId,req.user,content,category];
        
        let insertid;
        db.query(`INSERT 
        INTO
        COMMENT(postId, userId, comment, postDate, editDate,category)
        VALUES
        (?,(SELECT userId FROM USERS WHERE numId = ? LIMIT 1),?,NOW(),NOW(),?);`,params1,
        function(err,rows,fields){
            console.log(rows)
            if(err) console.log(err);
            insertid = rows.insertId;
            const params2 = [req.params.postId,req.params.postId,insertid,category]
            logger.info(`${req.method} / ip : ${ip} id : ${req.user} postid ${insertid} complete`);
            db.query(`INSERT 
            INTO 
            NOTIFICATIONS(userNumId,postId,commentId,alarmType,notificationDate,category)
            VALUES
            ((SELECT numId FROM USERS WHERE userId = (SELECT authorId FROM POST WHERE postId = ?)) ,?,?,0,NOW(),?)
            `,params2,(err2,results)=>{
              console.log(results)
              if(err2) logger.error(err2)
            })
        });
      //글쓰기
    }
    console.log(req.body);
    res.redirect(`/${category}/${req.params.postId}`);
});
  

//댓글 목록 가져오기
router.get("/comment/list/:postId",function(req,res){
    
    const params = [req.params.postId,category];
    db.query(`SELECT USERS.Githubid, COMMENT.comment
    FROM COMMENT
    INNER JOIN USERS
    ON COMMENT.postId = ? AND category = ?`,params,function(err,rows){
        
        if(err) console.log(err);
        else if(rows.length == 0){
            res.status(404).send('not found');
        }
        else{
            res.send(rows);
        }
    })
});

router.post("/comment/delete",function (req,res){
    if(req.isAuthenticated()){
        const params = [req.user,req.body.commentId,category];
        db.query(`DELETE FROM COMMENT WHERE userId = (SELECT userId FROM USERS WHERE numId = ?) AND commentId = ? AND category = ?`,params,(err,result)=>{
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
        
        const params = [req.user,req.params.postID,category];
        db.query(`
        SELECT *
        FROM LIKES
        WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = ? LIMIT 1;`,params,function(err1,rows){
            
            if(err1)
                logger.error(`DB ERROR : ${err1}`);
            if(rows.length == 0){
                
                db.query(`INSERT
                        INTO
                        LIKES
                        (authorId, postId,category)
                        VALUES 
                        ((SELECT userId FROM USERS WHERE numId = ?),?,?)
                `,params,function(err2){
                    if(err2)
                        logger.error(`DB ERROR : ${err2}`);
                    db.query(`SELECT * FROM DISLIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = ? LIMIT 1`,params,function(err3,rows2){
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
                db.query(`DELETE FROM LIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = ? LIMIT 1`,params,function(err2){
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
        let params = [req.user,req.params.postID,category];
        db.query(`SELECT * FROM DISLIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = ? LIMIT 1`,params,function(err1,rows){ 
            if(err1)
                logger.error(`DB ERROR : ${err1}`);
            if(rows.length == 0){
                db.query(`INSERT
                INTO
                DISLIKES
                (authorId, postId,category)
                VALUES 
                ((SELECT userId FROM USERS WHERE numId = ?),?,?)
                `,params,function(err2){
                    if(err2)
                        logger.error(`DB ERROR : ${err2}`);
                    db.query(`SELECT * FROM LIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = ? LIMIT 1`,params,function(err3,rows2){
                        if(err3)
                            logger.error(`DB ERROR : ${err3}`);
                        if(rows2.length != 0){
                            db.query(`DELETE FROM LIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = ? LIMIT 1`,params,function(err4){
                                if(err4)
                                    logger.error(`DB ERROR : ${err4}`);
                            })
                        }
                    })
                })
                
            }
            else{
                db.query(`DELETE FROM DISLIKES WHERE authorId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = ? LIMIT 1`,params,function(err2){
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
    let params = [req.params.postId,category];
    
    db.query(`SELECT COUNT(*) AS count FROM LIKES WHERE postId = ? AND category = ? `,params,function(err,likerow){
        if(err){
            logger.error(`DB ERROR : ${err}`);
            res.status(404);
        }
        db.query(`SELECT COUNT(*) AS count FROM DISLIKES WHERE postId = ? AND category = ? `,params,function(err2,dislikerow){
            if(err2){
                logger.error(`DB ERROR : ${err2}`);
                res.status(404);
            }
            //인기글
            db.query(`SELECT isBest FROM POST WHERE postId = ? AND category = ? LIMIT 1`,params,(err3,rows)=>{
                if(err3){
                    logger.error(err3);
                    res.status(404);
                }
                else if(rows.length == 0)
                    res.status(404)
                else{
                    if(parseInt(likerow[0].count)-parseInt(dislikerow[0].count) >= bestLike && rows[0].isBest == 0){
                        db.query(`UPDATE POST SET isBest = 1 WHERE postId = ? AND category = ? `,params,function(err4){
                            if(err4){
                                logger.error(`DB Error : ${err4}`)
                            }
                            const params2 = [req.params.postId,req.params.postId,null,2,category]
                            db.query(`INSERT 
                                INTO 
                                NOTIFICATIONS(userNumId,postId,commentId,alarmType,notificationDate,category)
                                VALUES
                                ((SELECT numId FROM USERS WHERE userId = (SELECT authorId FROM POST WHERE postId = ?)),?,?,?,NOW(),?)
                                `,params2,(err5,results)=>{
                                    if(err5) logger.error(err5)
                                })
                        })
                    }
                    else if(parseInt(likerow[0].count)-parseInt(dislikerow[0].count) < bestLike && rows[0].isBest == 1){
                        db.query(`UPDATE POST SET isBest = 0 WHERE postId = ? AND category = ?`,params,function(err4){
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
        let params = [req.user,req.params.postID,category];
        //신고 이미 했는지 확인
        db.query(`SELECT * FROM REPORTS WHERE userId = (SELECT userId FROM USERS WHERE numId = ?) AND postId = ? AND category = ? LIMIT 1`,params,function(err1,rows){ 
            if(err1)
                logger.error(`DB ERROR : ${err1}`);
            if(rows.length == 0){
                //신고 처리
                db.query(`INSERT
                INTO
                REPORTS
                (userId, postId,category)
                VALUES 
                ((SELECT userId FROM USERS WHERE numId = ?),?,?)
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