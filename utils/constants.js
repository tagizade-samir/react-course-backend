const USERNAME_REGEX = /^(?=[a-zA-Z0-9._]{5,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
const JWT_SECRET = 'lVmK3mNGOVdDxzI075omyF5yT0mZ5j5d'
const REQUIRED_NOTE_FIELDS = ['title', 'text', 'color', 'tags', 'isPublic']

module.exports = {
  USERNAME_REGEX,
  PASSWORD_REGEX,
  JWT_SECRET,
  REQUIRED_NOTE_FIELDS,
}
