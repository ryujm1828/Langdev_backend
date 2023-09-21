# Langdev_backend
## 사용 모듈
npm i express  
npm i express-seession  
npm i nodemon  
npm i passport  
npm i passport-github2  
npm i dotenv  
npm i winston  
npm i winston-daily-rotate-file  
npm i mysql  
npm i express-mysql-session  
npm i request-ip  
npm i sanitize-html  
npm i openai  
npm i redis  
npm i connect-redis  
npm i socket.io  
npm i node-nats-streaming  
npm i jsonwebtoken  

## api
- 글 목록(get) /api/:category/list
- 글 작성(post) /api/:category/write
- 글 삭제(post) /api/:category/delete/ (body = {postId : ~~})
- 글 1개 내용전송 (get) /api/:category/get/:postId
- 댓글 목록 가져오기(get) /api/:category/comment/list/:postId
- 댓글 삭제 /api/:category/comment/delete (body = {commentId : ~~})
- 글 좋아요(post) /api/:category/:postId/like
- 글 싫어요(post) /api/:category/:postId/dislike
- 좋아요 개수(get) /api/:category/:postId/likescount
- 싫어요 개수(get) /api/:category/:postId/

## Image
![image](https://github.com/ryujm1828/Langdev_backend/assets/83535846/92ae59b2-ee19-46fb-811b-772c76a15132)
