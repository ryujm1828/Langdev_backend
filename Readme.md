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

## api
### /api/id
#### 입력
없음   
#### 출력
로그인 상태 : id번호값   
비로그인 상태 : NULL

### /api/nickname
#### 입력
없음   
#### 출력
로그인 상태 : 닉네임    
비로그인 상태 : NULL

### /api/id
#### 입력
없음   
#### 출력
로그인 상태 : id번호값   
비로그인 상태 : NULL  

### /api/githubid
#### 입력
없음   
#### 출력
로그인 상태 : githubid   
비로그인 상태 : NULL  

### /board/:id
#### 입력
없음   
#### 출력
id값에 해당하는 게시물의 title,content json방식으로 보냄

### /api/chatGPT
#### 입력
post 방식으로 comment 입력
#### 출력
comment에 해당하는 답변 전송