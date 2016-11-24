module.exports = pointLerp

function pointLerp(off, a, b) {
  const prop = proportion(off, a, b)
  const x = lerp(prop, a[0], b[0])
  const y = lerp(prop, a[1], b[1])
  return [x, y]
}

function lerp(t, from, to) {
  const dif = (from - to) * t
  return from - dif
}

function proportion(off, a, b) {
  const c0 = a[0] - b[0]
  const c1 = a[1] - b[1]
  const l = Math.hypot(c0, c1)
  return off / l
}
