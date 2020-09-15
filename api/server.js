const express = require('express')
const helmet = require('helmet')
const cors = require('cors')

const usersRouter = require('../users/users-router.js')
// const authRouter = require('../auth/auth-router')
const bcryptjs = require('bcryptjs')
const Users = require("../users/users-model.js");

// importing libraries for implemanting making a session labrary
const session = require('express-session')
const knexSessionStore = require('connect-session-knex')(session)
const dbConnection = require('../database/connection')
//import to implement global authentication
const authenticate = require('../auth/authenticate-middleware')
// starting the server
const server = express()

const sessionConfiguration = {
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
// server.use('/api/auth', authRouter)
server.use((err, req, res, next) => {
  console.log(err.message)
  res.status(500).json({
    message: err.message
  })
})

server.get('/', (req, res) => {
  res.json({ api: 'up' })
})
server.post('/api/register', (req, res, next) => {
  let creds = req.body
  const rounds = process.env.HASH_ROUNDS || 4

  const hash = bcryptjs.hashSync(creds.password, rounds)

  creds.password = hash

  Users.add(creds)
    .then(saved => {
      res.status(201).json({ data: saved })
    })
    .catch(next)
})
server.post('/api/login', (req, res, next) => {
  //how to verify passwords?

  const { username, password } = req.body

  Users.findBy({ username })
    .then(users => {
      const user = users[0]
      if (user && bcryptjs.compareSync
        (password, user.password)) {
        // store the session to the database
        // product a cookie
        // send bac
        req.session.loggedIn = true
        req.session.username = user.username

        res.status(200).json({ message: 'Welcome!', session: req.session })
      } else {
        res.status(401).json({ message: 'Invalid credentials' })
      }
    })
    .catch(next)
})
server.get('/api/users', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.status(500).json({ error: 'error loging in, try again later.' })
      } else {
        res.status(204).end()
      }
    })
  }
})


module.exports = server
