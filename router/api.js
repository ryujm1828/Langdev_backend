const express = require('express');
const router = express.Router();
const db = require("../db/db");     
//id 전송
router.get('/id', (req, res) => {
    if(!req.user || req.isAuthenticated())
        res.send(req.user);
    else
        res.send(NULL);
});

//닉네임 전송
router.get('/nickname', (req,res)=>{
    if(!req.user || !req.isAuthenticated ){
        res.send(NULL);
    }
    else{
        const params = [req.user]
        db.query(`SELECT NICKNAME FROM USERS WHERE ID = ?`,params, function(err,rows){
        res.send(rows[0].NICKNAME);
        });
    }
})

//githubid 전송
router.get('/githubid', (req,res)=>{
    if(!req.user || !req.isAuthenticated ){
        res.send(NULL);
    }
    else{
        const params = [req.user]
        db.query(`SELECT NICKNAME FROM USERS WHERE ID = ?`,params, function(err,rows){
        res.send(rows[0].GITHUBID);
        });
    }
})

router.get("/board/:id",function(req,res){
    const params = [req.params.id];
    db.query(`SELECT * FROM BOARD WHERE PostID = ?`,params,function(err,rows){
      if(err) console.log(err);
      
      else if(rows.length == 0){
        res.status(404).send('not found');
      }

      else{
        const titlevalue = rows[0].Title;
        const contentvalue = rows[0].Content;
        res.send({title : titlevalue, content : contentvalue});
      }
    })
  })

module.exports = router;