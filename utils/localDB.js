const fs = require('fs')

const USERS_PATH = 'users.json'
const NOTES_PATH = 'notes.json'

const getDB = (path) => {
  const fileContent = fs.readFileSync(path, 'utf8')
  if (!fileContent) throw new Error('Not able to read DB' + path)

  return fileContent
}

const updateDB = (path, newValue) => {
  try {
    fs.writeFileSync(path, newValue, 'utf8')
  } catch (error) {
    throw e
  }
}

const addUser = (user) => {
  const usersDB = getDB(USERS_PATH)

  try {
    const users = JSON.parse(usersDB)
    const updatedUserObj = {
      ...users,
      [user.username]: user
    }
    updateDB(USERS_PATH, JSON.stringify(updatedUserObj, null, 2))
  } catch(e) {
    throw e
  }
}

const getUser = (username) => {
  const usersDB = getDB(USERS_PATH)

  try {
    const users = JSON.parse(usersDB)
    
    return users[username]
  } catch (error) {
    throw error
  }
}

const deleteUser = (username) => {
  const usersDB = getDB(USERS_PATH)

  try {
    const users = JSON.parse(usersDB)
    delete users[username]
    updateDB(USERS_PATH, JSON.stringify(users, null, 2))
    return true
  } catch (error) {
    return false
  }
}

const getUsersList = () => {
  const usersDB = getDB(USERS_PATH)

  try {
    const users = JSON.parse(usersDB)
    return Object.values(users)
  } catch (error) {
    throw error
  }
}

const getAllUserNotes = (username) => {
  const notesDB = getDB(NOTES_PATH)

  try {
    const notes = JSON.parse(notesDB)
    return notes[username]
  } catch (error) {
    throw error
  }
}

const getUserNotes = (username, page = 1, size = 10) => {
  const notesDB = getDB(NOTES_PATH)

  try {
    const notes = JSON.parse(notesDB)
    const userNotes = notes[username]
    const paginatedUserNotes = userNotes.slice(getStart(page, size), getEnd(page, size))

    return {
      data: paginatedUserNotes,
      total: userNotes.length,
    }
  } catch (error) {
    throw error
  }
}

const addNewNote = (note, username) => {
  const notesDB = getDB(NOTES_PATH)

  try {
    const notes = JSON.parse(notesDB)
    const userNotes = notes[username]
    const correctUserNotes = userNotes ?? []

    notes[username] = [...correctUserNotes, note]
    updateDB(NOTES_PATH, JSON.stringify(notes, null, 2))
  } catch (error) {
    throw error
  }
}

const deleteNote = (id, username) => {
  const notesDB = getDB(NOTES_PATH)

  try {
    const notes = JSON.parse(notesDB)
    const userNotes = notes[username]

    if (!userNotes || !Array.isArray(userNotes)) throw new Error('Not able to find user notes')

    const updatedUserNotes = userNotes.filter(note => note.id !== id)
    notes[username] = updatedUserNotes
    updateDB(NOTES_PATH, JSON.stringify(notes, null, 2))
  } catch (error) {
    throw error
  }
}

const updateNote = (id, username, updatedNote) => {
  const notesDB = getDB(NOTES_PATH)

  try {
    const notes = JSON.parse(notesDB)
    const userNotes = notes[username]

    if (!userNotes || !Array.isArray(userNotes)) throw new Error('Not able to find user notes')

    const updatedUserNotes = userNotes.map(note => {
      if (note.id === id) {
        return updatedNote
      }

      return note
    })
    notes[username] = updatedUserNotes
    updateDB(NOTES_PATH, JSON.stringify(notes, null, 2))
  } catch (error) {
    throw error
  }
}

const getStart = (page, size) => {
  return (page - 1) * size
}

const getEnd = (page, size) => {
  return (page - 1) * size + size
}

const getPublicNotes = (page = 1, size = 10) => {
  const notesDB = getDB(NOTES_PATH)

  try {
    const notes = JSON.parse(notesDB)
    const allNotes = Object.values(notes)
    const publicNotes = allNotes.flat(1).filter(note => note.isPublic)
    const paginatedPublicNotes = publicNotes.slice(getStart(page, size), getEnd(page, size))
    return {
      data: paginatedPublicNotes,
      total: publicNotes.length,
    }
  } catch (error) {
    throw error
  }
}

module.exports = {
  Auth: {
    addUser,
    getUser,
    deleteUser,
    getUsersList,
  },
  Notes: {
    getUserNotes,
    addNewNote,
    deleteNote,
    updateNote,
    getPublicNotes,
    getAllUserNotes,
  }
}
