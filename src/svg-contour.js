const redrawSteep = require('./utils/redraw-steep-curve')
const contourPathData = require('./utils/contour-path-data')
const drawLine = require('./utils/draw-line')


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
  const flattenedPathData = redrawSteep(0.2)(pathData)
  const contourD = contourPathData(offset)(flattenedPathData)
  const contourPath = drawLine(style, contourD, flattenedPathData)// el.getPathData({ normalize: true }))

  if (append)
    el.parentElement.appendChild(contourPath)

  return contourPath
}

module.exports = svgContour
