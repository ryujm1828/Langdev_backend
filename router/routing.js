//기타 라우팅

const express = require('express');
const router = express.Router();
const requestIp = require("request-ip");    //get ip
const logger = require('../log/logger');

//logout
router.post('/logout', function(req, res, next) {
    const ip = requestIp.getClientIp(req);
    logger.info(`${req.method} / ip : ${ip} id : ${req.user} logout`);
    req.session.destroy(() => {
      res.redirect('/');
    });
});

module.exports = router;