import Segment from './Segment'

export default class HalfopenLineSegment extends Segment {
  /* global p1, p2 */
  // we consider p1 as the originating point
  xCond(v) {
    return (
      this.p1.x > this.p2.x ?
      v < this.p1.x :
      this.p1.x < this.p2.x ?
      v > this.p1.x :
      true // in case it's horizontal only yCond
    )
  }
  yCond(v) {
    return (
      this.p1.y > this.p2.y ?
      v < this.p1.y :
      this.p1.y < this.p2.y ?
      v > this.p1.y :
      true // in case vertical only xCond
    )
  }
  intersect(other) { // this either returns a Point or null
    let inter
    try {
      inter = this.line().intersection(other.line())
    }
    catch (e) {
      inter = false
    }

    return (
        inter &&
        this.xCond(inter.x) && other.xCond(inter.x) &&
        this.yCond(inter.y) && other.yCond(inter.y) ?
        inter : null
    )
  }
}
