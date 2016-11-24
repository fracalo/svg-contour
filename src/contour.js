
const { drawPoint } = require('./utils/draw')
const contiguousBorderIntersection = require('./utils/contiguous-border-point-intersection')
const getControlPoints = require('./utils/get-control-points')
const drawLine = require('./utils/draw-line')
const pipe = require('./utils/pipe')


const svgContour = (el, op) => {
  if (! el instanceof SVGGeometryElement)
    throw Error('svgContour element parameter accepts only instances of SVGGeometryElement')
  const offset = op.offset || op
  if (typeof offset !== 'number')
    throw Error('svgContour offset option must be a number')
  const append = op.append || true
  if (typeof append !== 'boolean')
    throw Error('svgContour append option must be a boolean')
  const style = op.style || el.style
  if (typeof style !== 'object')
    throw Error('svgContour append option must be a object')

  const pathData = el.getPathData({ normalize: true })

  const mergedControlPoints = pipe(
    getControlPoints(Math.abs(offset)),
    x => {console.log('after getControlPoints', x); return x},
    contiguousBorderIntersection
  )(pathData)

  const [dUp, dDown] = mergedControlPoints.reduce((ac, x) => {
    ac[0].push(x.up)
    ac[1].push(x.down)
    return ac
  }, [[], []])

  const contourD = offset > 0 ? dUp : dDown
  const contourPath = drawLine(style, contourD, el.getPathData({ normalize: true }))

  if (append)
    el.parentElement.appendChild(contourPath)

  return contourPath
}


const testStyles = {
  stroke: '#00ff00', stokeWidth: 1
}
const testStyles2 = {
  stroke: 'blue', stokeWidth: 1
}

console.log('ciao');
/** *** **/
const testP = document.querySelector('path')
svgContour(testP, {
  offset: -15, style: testStyles2
})
