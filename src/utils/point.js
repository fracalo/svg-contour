
class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
  isEqual(other) {
    return this.x === other.x && this.y === other.y
  }
}

Point.prototype[Symbol.iterator] = function* () {
  yield this.x
  yield this.y
}

module.exports = Point
