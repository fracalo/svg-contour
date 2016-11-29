const pipe = require('./pipe')
const Point = require('./point')
const Segment = require('./segment')
// drawPoint for test
const { drawSeg } = require('./draw')

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


// [Segment] -> [Point, Null]
const offsetControlSegments = off => segments => segments.reduce((ac, s, i, arr) => {
  // keep track of slope changes
  const offsetLine = s.zeroLength() ? null : s.line().offset(off, s.reverse)

  if (i === 0) {
    if (!offsetLine)
      ac.push(null)
    else {
      ac.push(new Segment(s.p1, offsetLine.projection(s.p1)))
    }
  }
  if (i < arr.length - 1) {
    if (!offsetLine)
      ac.push(null)
    else {
      const followingValidSeg = nonZerolengthfallFront(arr, i)
      const rev = followingValidSeg.reverse
      ac.push(
        followingValidSeg ?
        new Segment(s.p2, offsetLine.intersection(followingValidSeg.line().offset(off, rev))) :
        new Segment(s.p2, offsetLine.projection(s.p2))
      )
    }
  }
  else { // last point
    if (!offsetLine)
      ac.push(null)
    else
      ac.push(new Segment(s.p2, offsetLine.projection(s.p2)))
  }
  return ac
}, [])
// utility of offsetSegmentsControlPoints
function nonZerolengthfallFront(arr, i) {
  while (++i < arr.length) {
    if (! arr[i].zeroLength())
      return arr[i]
  }
  return null
}

// [Segment, Null] -> [Segment]
const fallbackForZeroLength = segPoints => segPoints.map((cp, i, arr) => (
  cp !== null ?
  cp :
  fallbackCp(arr, i)
))

function fallbackCp(arr, i) {
  let bi = i
  while (--bi > -1) {
    if (arr[bi]) return arr[bi]
  }
  let fi = i
  while (++fi < arr.length) {
    if (arr[fi]) return arr[fi]
  }
  throw new Error('all zeroLength segments')
}

const mapToPointOfSeg = segments => segments.map(x => x.p2)
module.exports = off => pipe(
    getPoints,
    controlPolygonSegments,
    offsetControlSegments(off),
    fallbackForZeroLength,
    (x => x.map(s => {
      drawSeg(s.p1, s.p2)
      return s
    })),
    mapToPointOfSeg
  )
