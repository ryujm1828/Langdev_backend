const express = require('express');
const router = express.Router({mergeParams: true});
const categoryList = ['jayu','security']
const db = require("../../db/db");
const reportShow = 1;       //신고 헀을 때 안보이는 기준. (reportShow 이상으로 신고받으면 안보임)
//const sanitizer = require("../middle/sanitizer");
const logger = require('../../log/logger')

router.get("/list",function(req,res){
    
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
    ORDER BY POST.postDate DESC LIMIT ?,?
    `,params,function(err,rows){
        console.log(rows)
        if(err){
            logger.error(err);
            res.status(404)
        } 
        else
            res.send(rows);
        //게시글 목록 전송
    });
})

router.get("/get/:id",function(req,res){
    if(categoryList.includes(req.params.category)){
        let params = [reportShow,req.params.id];
        db.query(`SELECT title,content,postDate,editDate,tab,category,isBest,views,authorId
        FROM POST
        LEFT JOIN (
            SELECT postId
            FROM REPORTS
            GROUP BY postId
            HAVING COUNT(*) >= ?
        ) AS filtered_reports ON JAYUPOST.postId = filtered_reports.postId
        WHERE filtered_reports.postId IS NULL AND POST.postId = ? AND POST.isbest = true`,params,function(err,rows){
            
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
                
                db.query(`SELECT nickname FROM USERS WHERE userId = (SELECT authorId FROM POST WHERE postId = ?)`,[rows[0].authorId],(err2,nickname)=>{
                    if(err2) console.log(err2)
                    console.log(nickname);
                    rows[0].nickname = nickname[0].nickname;
                    res.send(rows[0]);
                })
                
                })
            }
        })
    }
    else{
        res.status(404)
    }
})

module.exports = router