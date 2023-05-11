const redis = require("redis")
const redisdb = redis.createClient({legacyMode: true})

module.exports = redisdb