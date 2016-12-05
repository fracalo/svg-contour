import Point from './Point'
import Line from './Line'


export default class Segment {
  constructor(p1, p2) {
    this.p1 = p1 instanceof Point ? p1 : new Point(p1[0], p1[1])
    this.p2 = p2 instanceof Point ? p2 : new Point(p2[0], p2[1])
    this.m = (this.p2.y - this.p1.y) / (this.p2.x - this.p1.x)
    this.reverse = this.p2.x < this.p1.x || (!isFinite(this.m) && this.p1.y > this.p2.y)
  }
  getLineOrPoint() {
    return (
      isNaN(this.m) ?
      this.p1 :
      this.line()
    )
  }
  line(center) {
    if (this.zeroLength())
      throw new Error('no single line available for zero length segment')

    const inter = isFinite(this.m) ?
    this.p1.y + this.m * -this.p1.x :
    this.p1.x

    return new Line(this.m, inter, center)
  }
  zeroLength() {
    return this.p1.isEqual(this.p2)
  }
}
