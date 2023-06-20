# Community_Backend
## 사용 모듈
- express
- express-seession
- nodemon
- passport
- passport-github2
- dotenv
- winston
- winston-daily-rotate-file
- mysql
- express-mysql-session
- request-ip
- sanitize-html
- openai
- redis
- connect-redis
- socket.io
- node-nats-streaming
- jsonwebtoken

## api
### /api/id
#### 입력
- 없음   
#### 출력
- 로그인 상태 : id번호값
- 비로그인 상태 : NULL

---

### /api/nickname
#### 입력
- 없음   
#### 출력
- 로그인 상태 : 닉네임
- 비로그인 상태 : NULL

---

### /api/id
#### 입력
- 없음   
#### 출력
- 로그인 상태 : id번호값
- 비로그인 상태 : NULL  

---

### /api/githubid
#### 입력
- 없음   
#### 출력
- 로그인 상태 : githubid
- 비로그인 상태 : NULL  

---

### /board/:id
#### 입력
- 없음
#### 출력
- id값에 해당하는 게시물의 title,content json방식으로 보냄

---

### /api/chatGPT
#### 입력
- post 방식으로 comment 입력
#### 출력
- comment에 해당하는 답변 전송

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