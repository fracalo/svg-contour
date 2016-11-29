
require('./path-data')
const svgContour = require('./svg-contour')

/** *** **/
const testPath = document.querySelector('path#one')
svgContour(testPath, {
  offset: 40,
  style: { stroke: 'blue', stokeWidth: 1 }
})
