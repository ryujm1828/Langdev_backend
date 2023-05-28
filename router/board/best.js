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

module.exports = router