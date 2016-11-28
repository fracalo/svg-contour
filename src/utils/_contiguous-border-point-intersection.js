const lineIntersection = require('./line-intersection')
// contiguousBorderIntersection :: [[{
//      point: Point,
//      up: Point,
//      down: Point
//    },
//    {
//      point: Point,
//      up: Point,
//      down: Point
//    }]] ->
//    [{
//      point: Point,
//      up: Point,
//      down: Point
//    }]
//    we go from an array of segments to an array of points where the
//    contiguos border points have been unified (intersection)
const contiguousBorderIntersection = segmentsData =>
  segmentsData.reduce((ac, [from, to], i, arr) => {
    if (i === 0) ac.push(from)
    else ac.push({
      point: from.point,
      up: lineIntersection([from.up, to.up], [arr[i - 1][0].up, arr[i - 1][1].up]),
      down: lineIntersection([from.down, to.down], [arr[i - 1][0].down, arr[i - 1][1].down])
    })

    if (i === arr.length - 1) ac.push(to) // if it's the last always push it in
    return ac
  }, [])

module.exports = contiguousBorderIntersection
