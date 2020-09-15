const express = require('express')
const helmet = require('helmet')
const cors = require('cors')

const usersRouter = require('../users/users-router.js')
const authRouter = require('../auth/auth-router')
const bcryptjs = require('bcryptjs')
// importing libraries for implemanting making a session labrary
const session = require('express-session') 
const knexSessionStore = require('connect-session-knex')(session)
const dbConnection = require('../database/connection')
//import to implement global authentication
const authenticate = require('../auth/authenticate-middleware')
// starting the server
const server = express()

const sessionConfiguration ={
    name: 'moster', //defaul value is sid 
    secret: process.env.SESSION_SECRET || 'keep it secret, keep it safe!', //key for encryption
    cookie: {
        maxAge: 1000 * 60 * 10, //miliseconds * minutes * hours
        secure: process.env.USE_SECURE_COOKIES || false, // send the cookie only over https (secure connections)
        httpOnly: true, // prevent JS code on client from accessing this cookie
    },
    resave: false,
    saveUnitialized: true, //read docs, it's related to GDPR compliance
    store: new knexSessionStore({
        knex: dbConnection,
        tablename: 'sessions',
        sidfieldname: 'sid',
        createtable: true,
        clearInterval: 1000 * 60 * 30, //time to check and remove expired sessions from database
    }),
}

// middleware
server.use(session(sessionConfiguration))//enables session support
server.use(helmet())
server.use(express.json())
server.use(cors())

server.use('/api/users', authenticate, usersRouter)
server.use('/api/auth', authRouter)
server.use((err, req, res, next) => {
  console.log(err.message)
  res.status(500).json({
    message: err.message
  })
})
server.get('/hash', (req, res) => {
    const password = req.headers.authorization
    const secret = req.headers.secret
  
    const hash = hashString(secret)
  
    if (password === 'mellon') {
      res.json({welcome: 'friend', secret, hash})
    } else {
      res.status(401).json({ you: 'cannot pass!'})    
    }
  })
  
  function hashString(str){
    // use bcryptjs to hash the str argument and return the hash
    const hash = bscryptjs.hashSync(str, 8) //the higher the number the more sequre your has is but the slower it makes your application. //make the number has big has your server can handle without breaking the user experience 
    return hash
  }
server.get('/', (req, res) => {
  res.json({ api: 'up' })
})


module.exports = server
