require('dotenv').config();
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const express = require("express");
const db = require("./db");

module.exports = () =>{

    //로그인 최초 성공시 실행 되는 
    // done(null, user.id)로 세션을 초기화 한다.
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // 사용자가 페이지를 방문할 때마다 호출되는 함수
    // done(null, id)로 사용자의 정보를 각 request의 user 변수에 넣어준다.
    passport.deserializeUser(function (id, done) {
        done(null, id);
    });
    
    passport.use(
        new GitHubStrategy({
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL 
        },
        function(accessToken, refreshToken, profile, done) {
            //if(profile.id가 sql에 없으면 데이터 저장)
            const params = [profile.id]
            db.query(`SELECT * from USERS where ID=? ;`,params,function(err,rows,fields){
                if(rows.length === 0){
                    //유저회원가입
                    db.query(`INSERT INTO USERS
                    (ID, Githubid, Nickname)
                    VALUES(${profile.id}, '${profile.username}', '${profile.username}');`,
                    function(err,rows,fields){
                        if(err) console.log(err);
                    });
                }
                else{
                    console.log(`${profile.id} is already exist`);
                }
            })
            return done(null,profile);
        }
    ));
}