
/* global svgContour */
const testPath = document.querySelector('#flat')
const offsetPath = svgContour(testPath, {
  offset: -40,
  style: { stroke: 'lime', stokeWidth: 1 }
})

console.log('svgContour returns a ref: ', offsetPath)
