//인증과 관련된 작업들
const db = require("../db/db");
const express = require('express');
const router = express.Router();
const passport = require("passport");
const crypto = require("crypto");

//github 로그인 처리
router.get('/github', passport.authenticate('github',{
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true,
  successFlash: true
}));

//github 로그인 데이터 받아오기
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
});

module.exports = router;