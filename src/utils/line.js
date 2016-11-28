const Point = require('./point')


class Line {
  constructor(m, inter, center) {
    this.m = m
    this.inter = inter
    this.vertical = ! isFinite(this.m)
    this.horizontal = this.m === 0
    this.center = center
  }
  func(x) {
    return (
      isFinite(this.m) ?
      this.m * x + this.inter :
      this.inter
    )
  }
  offset(n) {
    if (! isFinite(this.m))
      return new Line(this.m, this.inter - n)

    const vertDisplacement = n * Math.sqrt(1 + Math.pow(this.m, 2)) + this.inter
    // n / Math.cos(Math.atan(this.m)) + this.inter TODO check why this don't work
    return new Line(this.m, vertDisplacement)
  }
  intersection(other) {
    // return either a Point : [Number, Number]
    // true in case it's the same line
    // false in case parallel
    if (this.vertical && other.vertical)
      return this.inter === other.inter
    if (this.vertical) return new Point(this.inter, other.func(this.inter))
    if (other.vertical) {
      return new Point(other.inter, this.func(other.inter))
    }
    const crossingX = (this.inter - other.inter) / (other.m - this.m)
    return (
      isNaN(crossingX) ? true : // same m same inter
      ! isFinite(crossingX) ? false : // same m different inter
      new Point(crossingX, this.func(crossingX))
    )
  }
  projection(p) {
    const m2 = -1 / this.m
    const inter2 = isFinite(m2) ? p.y - m2 * p.x : p.x
    const l2 = new Line(m2, inter2)
    return this.intersection(l2)
  }
}


module.exports = Line
