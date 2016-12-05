import './path-data-polyfill'
import svgContour from './svg-contour'

if (typeof window === 'undefined')
  throw new Error('svgContour is developed for browser only, \n' +
  'if you want to create an offset pathData from an SVG path data outside the DOM\n' +
  'take look at src/utils/{redraw-steep-curve.js, contour-path-data.js} files')

window.svgContour = svgContour
