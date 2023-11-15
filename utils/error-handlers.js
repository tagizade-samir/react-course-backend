const checkDbCollection = (collection) => {
  if (!collection || !collection.set || !collection.get) return false

  return true
}

module.exports = {
  checkDbCollection,
}
