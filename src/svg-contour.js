import redrawSteep from './utils/redraw-steep-curve'
import contourPathData from './utils/contour-path-data'
import drawLine from './utils/draw-line'


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
  if (!op.style) { // if using default style object let's copy most used attributes for path ..
    const common = ['fill', 'stroke', 'stoke-width', 'stoke-dasharray', 'stroke-linecap', 'stroke-linejoin']
    common.reduce((ac, x) => (
      el.getAttribute(x) ?
      Object.assign(ac, { [x]: el.getAttribute(x) }) :
      ac
    ), style)
  }
  if (typeof style !== 'object')
    throw Error('svgContour append option must be a object')

  // we always use getPathData({normalized:true})
  const pathData = el.getPathData({ normalize: true })

  // before processing the path data increase the control points if needed
  const flattenedPathData = redrawSteep(0.3)(pathData) // TODO steepness should be somehow related to offness

  // contourPathData creates the offset path data
  const contourD = contourPathData(offset)(flattenedPathData)

  // drawLine draws a new path retracing the offset path data on top of flattened path data
  const contourPath = drawLine(style, contourD, flattenedPathData)

  if (append)
    el.parentElement.appendChild(contourPath)

  return contourPath
}

export default svgContour
