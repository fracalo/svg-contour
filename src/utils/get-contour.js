const pipe = require('./pipe')
const Point = require('./point')
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

// [Segment] -> [Segment, Null]
const offsetSegments = off => segments => segments.map(s => {
  if (s.zeroLength())
    return null

  const offsetLine = s.line().offset(off)
  const offsetPoints = new Segment(
    offsetLine.projection(s.p1),
    offsetLine.projection(s.p2)
  )
  return offsetPoints
})
// [Segment] -> [Point, Null]
const offsetSegmentsControlPoints = off => segments => segments.reduce((ac, s, i, arr) => {
  const offsetLine = s.zeroLength() ? null : s.line().offset(off)

  if (i === 0) {
    if (!offsetLine)
      ac.push(null)
    else {
      ac.push(offsetLine.projection(s.p1))
    }
  }

  if (i < arr.length - 1) {
    if (!offsetLine)
      ac.push(null)
    else {
      const followingValidSeg = nonZerolengthfallFront(arr, i)
      ac.push(
        followingValidSeg ?
        offsetLine.intersection(followingValidSeg.line().offset(off)) :
        offsetLine.projection(s.p2)
      )
    }
  }
  else { // last point
    if (!offsetLine)
      ac.push(null)
    else
      ac.push(offsetLine.projection(s.p2))
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

// utility of fallbackForZeroLength
// function lookFor2Points(arr, i) {
//   const p2 = pointWithFallBackFrontward(arr, i)
//   const p1 = i === 0 ? p2 : arr[i - 1].p2
//   if (!p1 && !p2) throw new Error('all zeroLength segments')
//   return (
//     p1 && p2 ?
//     new Segment(p1, p2) :
//     new Segment(p1, p1) // if at the end there's no valid point repeat p1
//   )
// }
// // utility of lookFor2Points
// function pointWithFallBackFrontward(arr, index) {
//   let i = index - 1
//   while (++i < arr.length) {
//     if (arr[i])
//       return arr[i].p1
//   }
//   return null
// }

module.exports = off => pipe(
    getPoints,
    controlPolygonSegments,
    offsetSegmentsControlPoints(off),
    (x => x.map(s => {
      console.log('s', s)
      return s
    })),
    fallbackForZeroLength,
    (x => x.map(s => {
      console.log('fallbacked', s)
      return s
    }))
  )


  // const segmentsToLinePoints = segments => segments.reduce((ac, s, i, arr) => {
  //   if (i === 0) {
  //     const first = lineWithFallBackFrontward(s.p1, arr, i)
  //     ac.push(first)
  //   }
  //   const before = ac.slice(-1)[0]
  //   if (s.zeroLength()) {
  //     ac.push(before)
  //   }
  //   else if (i < arr.length - 1) {
  //     const after = lineWithFallBackFrontward(s.p2, arr, i + 1)
  //     const line = before && after ?
  //       linesRotationLerp(s.p2, before, after) :
  //       before
  //     ac.push(line)
  //   }
  //   else {
  //     ac.push(s.line(s.p2))
  //   }
  //   return ac
  // }, [])
  // function linesRotationLerp(center, segFrom, segTo) {
  //   const beforeRad = Math.atan(segFrom.m)
  //   const afterRad = Math.atan(segTo.m)
  //   const increment = (afterRad - beforeRad) / 2
  //   const m = Math.tan(beforeRad + increment)
  //   const inter = isFinite(m) ?
  //   center.y + m * -center.x :
  //   center.x
  //   return new Line(m, inter, center)
  // }
  // function lineWithFallBackFrontward(p, arr, index) {
  //   let i = index - 1
  //   while (++i < arr.length) {
  //     if (! arr[i].zeroLength())
  //       return arr[i].line(p)
  //   }
  // }
