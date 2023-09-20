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

## 구동방법
1. cd community_backend 로 폴더에 들어온다
2. npm i "" 으로 위에 적힌 모듈들을 설치해준다. ex)npm i express
3. npm start 입력하면 실행 완료
4. localhost:5000 으로 들어가면 볼 수 있음

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
