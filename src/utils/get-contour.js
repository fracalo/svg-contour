const pipe = require('./pipe')
const Point = require('./point')
const Line = require('./line')
const Segment = require('./segment')
// drawPoint for test
// const { drawPoint } = require('./draw')

// getPoints:: pathData -> [Point]
const getPoints = pd =>
  pd.reduce((ac, x) => {
    let i = 0
    while (i + 2 <= x.values.length) {
      const [a, b] = x.values.slice(i, i + 2)
      ac.push(new Point(a, b))
      i = i + 2
    }
    return ac
  }, [])

// controlPolygonSegments ::
// [Point] -> [Segment]
// given an array of points it gives back an array of segments
const controlPolygonSegments = points =>
  points.reduce((ac, x, i, arr) => {
    if (i === 0)
      return ac
    ac.push(new Segment(arr[i - 1], x))
    return ac
  }, [])


const segmentsToLinePoints = segments => {
  const rotatedLines = []
  let i = -1
  while (++i < segments.length) {
    if (i === 0) {
      const first = lineWithFallBackFrontward(segments[i].p1, segments, i)
      rotatedLines.push(first)
    }
    const before = rotatedLines.slice(-1)[0]
    if (segments[i].zeroLength()) {
      rotatedLines.push(before)
    }
    else if (i < segments.length - 1) {
      const after = lineWithFallBackFrontward(segments[i].p2, segments, i + 1)
      const line = before && after ?
        linesRotationLerp(segments[i].p2, before, after) :
        before
      rotatedLines.push(line)
    }
    else {
      rotatedLines.push(segments[i].line(segments[i].p2))
    }
  }
  return rotatedLines
}
function linesRotationLerp(center, segFrom, segTo) {
  const beforeRad = Math.atan(segFrom.m)
  const afterRad = Math.atan(segTo.m)
  const increment = (afterRad - beforeRad) / 2
  const m = Math.tan(beforeRad + increment)
  const inter = isFinite(m) ?
  center.y + m * -center.x :
  center.x
  return new Line(m, inter, center)
}
function lineWithFallBackFrontward(p, arr, index) {
  let i = index - 1
  while (++i < arr.length) {
    if (! arr[i].zeroLength())
      return arr[i].line(p)
  }
}

// [Line] -> [Point]
const offsetLinePoints = off => lines =>
  lines.map(l => l.offset(off).projection(l.center))


module.exports = off => pipe(
    getPoints,
    controlPolygonSegments,
    segmentsToLinePoints,
    (x => x.map(s => {
      console.log('s', s);
      return s
    })),
    offsetLinePoints(off)

  )