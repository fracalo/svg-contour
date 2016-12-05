

// drawLine :: (Style, D, pointSeq) -> SVGPathElement

const svgNS = 'http://www.w3.org/2000/svg'

export default function drawLine(styles, dataPairs, pData) {
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
