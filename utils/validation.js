const { USERNAME_REGEX, PASSWORD_REGEX, REQUIRED_NOTE_FIELDS } = require('./constants')

const isValidUsername = (username) => {
  if (!username) return false

  return USERNAME_REGEX.test(username)
}

const isValidPassword = (password) => {
  if (!password) return false

  return PASSWORD_REGEX.test(password)
}

const isValidNote = (note) => {
  if (!note) return false

  const areFieldsExist = REQUIRED_NOTE_FIELDS.every(field => field in note)
  
  if (!areFieldsExist) return false

  const { title, text, tags, color } = note
  const areFieldsValid =
    validateString(title, 25)
    && validateString(text, 250)
    && Array.isArray(tags) && tags.every(tag => typeof tag === 'string')
    && validateString(color, 20)

  if (!areFieldsValid) return false

  return true
}

const validateString = (string, length) => {
  if (typeof string !== 'string' || !string || string.length > length || string.length < 2) return false

  return true
}

module.exports = {
  isValidUsername,
  isValidPassword,
  isValidNote,
}
