//인증과 관련된 작업들
const db = require("../db/db");
const express = require('express');
const router = express.Router();
const passport = require("passport");
const crypto = require("crypto");

//github 로그인 처리
router.get('/login', passport.authenticate('local',{failureRedirect: '/login' }),

  function(req, res) {
  res.redirect('/');
});

router.post('/pwchange', function(req,res){
  const changepw = req.body.changepw;
  if(!req.isAuthenticated()){
    res.status(404).send('not found');
  }
  else{
    db.query("UPDATE pw ",function(){

    })
  }
})

module.exports = router;