import Point from './Point'


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
  offset(n, reverse) {
    if (reverse)
      n = -n

    if (! isFinite(this.m)) {
      const vert = new Line(this.m, this.inter - n)
      vert.center = this.center ? vert.projection(this.center) : null
      return vert
    }

    const vertDisplacement = n * Math.sqrt(1 + Math.pow(this.m, 2)) + this.inter
    // n / Math.cos(Math.atan(this.m)) + this.inter TODO check why this don't work
    const line = new Line(this.m, vertDisplacement)
    line.center = this.center ? line.projection(this.center) : null
    return line
  }
  intersection(other) {
    // return either a Point : [Number, Number]
    // or throw

    if (this.vertical && other.vertical) {
      if (this.inter !== other.inter) {
        throw new Error('parallel vertical lines don\'t intersect')
      }
      return other.center || this.center
    }
    if (this.vertical)
      return new Point(this.inter, other.func(this.inter))
    if (other.vertical)
      return new Point(other.inter, this.func(other.inter))

    const crossingX = (this.inter - other.inter) / (other.m - this.m)

    if (Math.abs(crossingX) === Infinity)
      throw new Error('parallel lines don\'t intersect')
    if (isNaN(crossingX) && !other.center && !this.center) // same m different inter (parallel)
      throw new Error('same lines don\'t intersect - if center is set it will be used as fallback')

    return (
      isNaN(crossingX) && other.center ? other.center :
      isNaN(crossingX) && this.center ? this.center : // if we're dealing with same line we fallback on a center property if present
      isFinite(crossingX) ? new Point(crossingX, this.func(crossingX)) : // standard case
      null
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
