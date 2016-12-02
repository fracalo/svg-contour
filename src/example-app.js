
require('./path-data-polyfill')
const svgContour = require('./svg-contour')

window.svgContour = svgContour
/** *** **/
const testPath = document.querySelector('#flatQ')
const offsetPath = svgContour(testPath, {
  offset: -40,
  style: { stroke: 'blue', stokeWidth: 1 }
})

console.log('svgContour returns a ref: ', offsetPath)
