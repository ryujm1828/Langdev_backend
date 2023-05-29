const express = require('express');
const router = express.Router({mergeParams: true});
const db = require("../../db/db");
//const sanitizer = require("../middle/sanitizer");
const logger = require('../../log/logger')

console.log("d")

router.get("/list",function(req,res){
    console.log("dd")
    if(req.isAuthenticated()){
        const params = [req.user]
        db.query("SELECT category,postId,commentId,alarmType,notificationDate FROM NOTIFICATIONS WHERE userNumId = ?",params,(err,rows)=>{
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

router.post("/delete",function (req,res){
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

router.delete("/deleteAll",function(req,res){
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

module.exports = router