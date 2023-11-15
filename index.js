const express = require('express')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const env = require('dotenv').config()

const { isValidUsername, isValidPassword, isValidNote } = require('./utils/validation')
const { JWT_SECRET } = require('./utils/constants')
const { Auth, Notes } = require('./utils/localDB')

const app = express()

app.use(express.json())
app.use(express.urlencoded({
  extended: true,
}))

app.get('/', (_, res) => {
  res.sendStatus(200)
})

// Authorization for users
app.post('/auth', async (req, res) => {
  const { username, password } = req.body
  const isUsernameValid = isValidUsername(username)
  const isPasswordValid = isValidPassword(password)
  
  if (!isUsernameValid || !isPasswordValid) {
    res.status(400)
    res.send('Invalid credentials')
    return
  }

  const user = Auth.getUser(username)

  if (!user) {
    res.status(404)
    res.send('User was not found')
    return
  }

  const userPassword = await user.password

  if (password !== userPassword) {
    res.status(401)
    res.send('Invalid credentials')
    return
  }
  
  const token = jwt.sign({ username: username }, JWT_SECRET)

  res.status(200)
  res.send({
    token: token,
  })
})

// Admin add new user
app.post('/auth/admin', async (req, res) => {
  const { clientSecret } = req.query
  if (clientSecret !== env.parsed.CLIENT_SECRET) {
    res.status(401)
    res.send('You don\'t have access to this route')
    return
  }

  const { username, password } = req.body
  const isUsernameValid = isValidUsername(username)
  const isPasswordValid = isValidPassword(password)
  if (!isPasswordValid || !isUsernameValid) {
    res.status(400)
    res.send('Invalid username or password')
    return
  }

  const user = Auth.getUser(username)

  if (user) {
    res.status(400)
    res.send('User already exists')
    return
  }

  const newUser = { username, password }

  try {
    Auth.addUser(newUser)
    res.status(201)
    res.send('User was created')
  } catch (error) {
    res.status(500)
    res.send(error)
  }
})

// Admin delete user
app.delete('/auth/admin', async (req, res) => {
  const { clientSecret } = req.query
  if (clientSecret !== env.parsed.CLIENT_SECRET) {
    res.status(401)
    res.send('You don\'t have access to this route')
    return
  }

  const { username } = req.body
  if (!username) {
    res.status(400)
    res.send('Invalid request')
    return
  }

  const user = Auth.getUser(username)

  if (!user) {
    res.status(404)
    res.send('User not found')
    return
  }

  const result = Auth.deleteUser(username)

  if (result) {
    res.status(200)
    res.send('User was deleted')
  } else {
    res.status(500)
    res.send('Something went wrong')
  }
})

// Admin get users list. Get one by username or get all
app.get('/auth/admin', async (req, res) => {
  const { username, clientSecret } = req.query
  if (clientSecret !== env.parsed.CLIENT_SECRET) {
    res.status(401)
    res.send('You don\'t have access to this route')
    return
  }

  if (username && typeof username === 'string') {
    try {
      const user = Auth.getUser(username)
      
      if (!user) {
        res.status(404)
        res.send('User was not found')
        return
      }
  
      res.status(200)
      res.send(user)
      return
    } catch (error) {
      res.status(500)
      res.send('Something went wrong')
    }
  }

  try {
    const usersList = Auth.getUsersList()
  
    res.status(200)
    res.send(usersList)
  } catch (error) {
    res.status(500)
    res.send('Something went wrong')
  }
})

// Add a note
app.post('/notes', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1]

  if (!token) {
    res.status(400)
    res.send('Token was not provided')
    return
  }

  const decodedToken = jwt.verify(token, JWT_SECRET)

  if (!decodedToken || !decodedToken.username) {
    res.status(401)
    res.send('Not authorized')
    return
  }

  const isNoteValid = isValidNote(req.body)

  if (!isNoteValid) {
    res.status(400)
    res.send('Invalid note')
    return
  }

  const newNote = {
    ...req.body,
    id: uuidv4(),
  }

  try {
    Notes.addNewNote(newNote, decodedToken.username)
    res.status(201)
    res.send('Note was created')
  } catch (error) {
    res.status(500)
    res.send(error)
  }
})

// Get notes. Get personal notes with type=personal or get public with type=public
app.get('/notes', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1]

  if (!token) {
    res.status(400)
    res.send('Token was not provided')
    return
  }

  const decodedToken = jwt.verify(token, JWT_SECRET)

  if (!decodedToken || !decodedToken.username) {
    res.status(401)
    res.send('Not authorized')
    return
  }

  const { type, page, size } = req.query

  if (!type || !['personal', 'public'].includes(type)) {
    res.status(400)
    res.send('Invalid type')
    return
  }

  if (type === 'personal') {
    try {
      const userNotes = Notes.getUserNotes(decodedToken.username, JSON.parse(page), JSON.parse(size))
      res.status(200)
      res.send(userNotes)
    } catch (error) {
      res.status(500)
      res.send(error)
    }
  } else {
    try {
      const publicNotes = Notes.getPublicNotes(JSON.parse(page), JSON.parse(size))
      res.status(200)
      res.send(publicNotes)
    } catch (error) {
      res.status(500)
      res.send(error)
    }
  }
})

// Delete a personal note
app.delete('/notes', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1]

  if (!token) {
    res.status(400)
    res.send('Token was not provided')
    return
  }

  const decodedToken = jwt.verify(token, JWT_SECRET)

  if (!decodedToken || !decodedToken.username) {
    res.status(401)
    res.send('Not authorized')
    return
  }

  const userNotes = Notes.getAllUserNotes(decodedToken.username)

  if (!userNotes) {
    res.status(404)
    res.send('User notes were not found')
    return
  }

  if (!userNotes || !Array.isArray(userNotes)) {
    res.status(500)
    res.send('Something went wrong with user notes')
    return
  }

  const idToDelete = req.query.id

  if (!idToDelete) {
    res.status(400)
    res.send('Id was not found')
    return
  }

  const isNoteExist = userNotes.find(note => note.id === idToDelete)

  if (!isNoteExist) {
    res.status(404)
    res.send('Note to delete was not found')
    return
  }

  try {
    Notes.deleteNote(idToDelete, decodedToken.username)
    res.status(200)
    res.send('Note was successfully deleted')
  } catch (error) {
    res.status(500)
    res.send(error)
  }
})

// Update a personal note
app.put('/notes', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1]

  if (!token) {
    res.status(400)
    res.send('Token was not provided')
    return
  }

  const decodedToken = jwt.verify(token, JWT_SECRET)

  if (!decodedToken || !decodedToken.username) {
    res.status(401)
    res.send('Not authorized')
    return
  }

  const userNotes = Notes.getAllUserNotes(decodedToken.username)

  if (!userNotes) {
    res.status(404)
    res.send('User notes were not found')
    return
  }

  if (!userNotes || !Array.isArray(userNotes)) {
    res.status(500)
    res.send('Something went wrong with user notes')
    return
  }

  const idToUpdate = req.query.id

  if (!idToUpdate) {
    res.status(400)
    res.send('Id was not found')
    return
  }

  const isNoteExist = userNotes.find(note => note.id === idToUpdate)

  if (!isNoteExist) {
    res.status(404)
    res.send('Note to update was not found')
    return
  }

  const updatedNote = {
    ...isNoteExist,
    ...req.body,
  }

  const isNoteValid = isValidNote(updatedNote)

  if (!isNoteValid) {
    res.status(400)
    res.send('Invalid note')
    return
  }

  try {
    Notes.updateNote(idToUpdate, decodedToken.username, updatedNote)
    res.status(200)
    res.send('Note was successfully updated')
  } catch (error) {
    res.status(500)
    res.send(error)
  }
})

app.listen(process.env.PORT || 3000)
