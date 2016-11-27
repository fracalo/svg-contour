module.exports.lineIntersection = lineIntersection
module.exports.lineFun = lineFun

// lineIntersection :: (Segment, Segment) -> Point || true(in case same line) || false (if parallel)
function lineIntersection(line1, line2) {
  // const line1 = lineFun(seg1)
  // const line2 = lineFun(seg2)

  if (line1.vertical || line2.vertical) // deal with special case of vertical line
    return lineIntersectionWithVertical(line1, line2)
  if (line1.horizontal && line2.horizontal)
    return lineIntersectionBothHorizontal(line1, line2)

  const x = (line1.inter - line2.inter) / (line2.m - line1.m)
  return [x, line1.y(x)]
}
// lineIntersectionWithVertical :: (lineFunc, lineFunc) -> Bool || Point
function lineIntersectionWithVertical(l1, l2) {
  return (
    l1.vertical && l2.vertical && l1.x === l2.x ? // same lines
    true : // TODO returning true.. maybe a more descriptive response is needed
    l1.vertical && l2.vertical && l1.x !== l2.x ?
    false : // this should never be the case in our scenario
    l1.vertical ?
    [l1.x, l2.y(l1.x)] :
    [l2.x, l1.y(l2.x)]
  )
}
function lineIntersectionBothHorizontal(y1, y2) {
  return y1.y() === y2.y()
}

function lineFun(seg) {
  const m = lineSlope(seg)
  const [[x1, y1]] = seg // just need one point

  if (! isFinite(m)) // if the line happens to be vertical it m will be Infinity
    return { vertical: true, x: x1 }

  if (m === 0) // with m === 0 line is horizontal
    return {
      horizontal: true,
      y: () => y1,
      inter: y1,
      m: 0
    }

  const y = x => m * (x - x1) + y1
  return {
    y,
    m,
    inter: y(0)
  }
}
function lineSlope([[x1, y1], [x2, y2]]) {
  return (y1 - y2) / (x1 - x2)
}
