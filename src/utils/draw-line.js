module.exports = drawLine

// drawLine :: (Style, D, pointSeq) -> SVGPathElement

const svgNS = 'http://www.w3.org/2000/svg'
// const commandSize = {
//   M: 2,   L: 2,   Q: 4,
//   T: 2,   C: 6,   S: 4,   Z: 0
//   // TODO missing A, H, V
// }

function drawLine(styles, dataPairs, pData) {
  const data = dataPairs.reduce((a, s) => (
    [...a, ...s]
  ), [])
  const p = document.createElementNS(svgNS, 'path')
  Object.assign(p.style, styles)
  let i = 0
  let dataIndex = 0
  while (i < pData.length) {
    const command = pData[i]
    const size = command.values.length // commandSize[command.type]
    command.values = data.slice(dataIndex, size + dataIndex)
    dataIndex += size
    i++
  }
  p.setPathData(pData)
  return p
}
