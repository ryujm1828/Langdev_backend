const express = require("express");

function jwtDecoder(req,res,next) {
    
    const authorization = req.headers.authorization;

    if (authorization && authorization.startsWith("Bearer ")) {
       const u = DecodeJWT(authorization.substring(7));
       if (u)
          req.User = u;
       else
          console.log("jwt found, but it was not valid.");
    }
  next();
}

module.exports = jwtDecoder;