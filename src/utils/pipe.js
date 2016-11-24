module.exports = (...arr) => arg =>
  arr.reduce((ac, f) => f(ac), arg)
