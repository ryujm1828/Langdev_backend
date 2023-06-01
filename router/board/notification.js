const express = require('express');
const router = express.Router({mergeParams: true});
const db = require("../../db/db");
//const sanitizer = require("../middle/sanitizer");
const logger = require('../../log/logger')
const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;



router.get("/list",function(req,res){
    if(req.user){
        console.log("user")
        console.log(req.user)
        const params = [req.user]
        db.query("SELECT category,postId,commentId,alarmType,notificationDate FROM NOTIFICATIONS WHERE userId = ?",params,(err,rows)=>{
            if(err) logger.error(err)
            else{
                console.log(rows)
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
        db.query(`DELETE FROM NOTIFICATIONS WHERE userId = ? AND notificationId = ? `,params,(err,result)=>{

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
        db.query(`DELETE FROM NOTIFICATIONS WHERE userId = ?`,params,(err)=>{
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