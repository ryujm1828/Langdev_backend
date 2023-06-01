//인증과 관련된 작업들
const express = require('express');
const router = express.Router();
const passport = require("passport");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;
const db = require("../db/db");

//github 로그인 처리
router.get('/github', passport.authenticate('github',{
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true,
  successFlash: true,
  session: false
}));

//github 로그인 데이터 받아오기
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login',session:false}),
  async function(req, res) {
    await db.query(`SELECT nickname,userId,numId FROM USERS WHERE numId = ${req.user.id}`,(err,rows)=>{
      if(err){
        console.log(err)
      }
      const userdata = rows[0];
      const user = {nickname : userdata.nickname, userId : userdata.userId};
      const token = jwt.sign({id: userdata.userId, expires: Date.now() + 3600}, jwtSecret);
      
      res.redirect(`/callback/?user=${JSON.stringify(user)}&token=${token}`);
    })
    
    
    // Successful authentication, redirect home.

});

module.exports = router;