
const Point = require('./point')
const pipe = require('./pipe')

// recursive utility for checking and dividing curve
const splitIfSteep = fr => (curve) => {
  const [p1, c1, c2, p2] = curve
  const mid = (c1.avg(c2).avg(p1.avg(c1))).avg(c1.avg(c2).avg(p2.avg(c1)))
  const h = mid.dist(p1.avg(p2))

  if (fr * p1.dist(p2) > h)
    return inflateCurveToPathSegments(curve) // base case

  const curve1 = [p1, p1.avg(c1), c1.avg(c2).avg(p1.avg(c1)), mid]
  const curve2 = [mid, c1.avg(c2).avg(p2.avg(c2)), p2.avg(c2), p2]
  return [...splitIfSteep(fr)(curve1), ...splitIfSteep(fr)(curve2)]
}

// PathSeg -> [Point]
const flattenPathSeg = ps => {
  const ac = []
  let i = 0
  while (i + 2 <= ps.values.length) {
    const [a, b] = ps.values.slice(i, i + 2)
    ac.push(new Point(a, b))
    i = i + 2
  }
  return ac
}
// [Point] -> [PathSeg]
const inflateCurveToPathSegments = ([p1, c1, c2, p2]) => ([
  { type: 'L', values: [...p1] },
  { type: 'C', values: [...c1, ...c2, ...p2] }
])

// goes throug the points and checks curve steepness,
// in case it's too steep it splits recursevily until flat enough
const redrawSteepCurve = flatRatio => pd =>
  pd.reduce((ac, ps, i, arr) => {
    if (ps.type !== 'C')
      return [...ac, ps]

    const p1 = new Point(...arr[i - 1].values.slice(-2))
    const rest = flattenPathSeg(ps)
    return [
      ...ac,
      ...splitIfSteep(flatRatio)([p1, ...rest])]
  }, [])

const simplifyPoints = pathdata =>
  pathdata.reduce((ac, ps, i, arr) => {
    if (ps.type === 'L') { // we suppose L will never be first point..
      const current = new Point(...ps.values)
      const leading = new Point(...arr[i - 1].values.slice(-2))
      const following =
        i < arr.length - 1 && arr[i + 1].type !== 'Z' ?
        new Point(...arr[i + 1].values.slice(-2)) :
        null
      if (current.isEqual(leading) || (following && current.isEqual(following)))
        return ac
    }
    return [...ac, ps]
  }, [])

module.exports = off => pipe(
  redrawSteepCurve(off),
  simplifyPoints
)
