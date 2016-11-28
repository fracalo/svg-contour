const svgNS = 'http://www.w3.org/2000/svg'
const svg = document.querySelector('svg')
const pipe = require('./pipe')


const drawPoint = (p, col) => {
  const el = circleCreator(p)
  el.style.fill = col
  svg.appendChild(el)
}
exports.drawPoint = drawPoint

const drawSeg = (from, to) => {
  const f = circleCreator(from)
  f.style.fill = 'white'
  const t = circleCreator(to)
  t.style.fill = 'magenta'
  const l = lineCreator(from, to)
  const els = [f, t, l]
  els.forEach(x => svg.appendChild(x))
}
exports.drawSeg = drawSeg

function lineCreator(from, to) {
  const [x1, y1] = from
  const [x2, y2] = to
  const el = document.createElementNS(svgNS, 'line')
  el.setAttribute('x1', x1)
  el.setAttribute('y1', y1)
  el.setAttribute('y2', y2)
  el.setAttribute('x2', x2)
  return el
}
// assuming a path of only M and C TODO
const divideInVector = pd =>
  pd.reduce((ac, x) => {
    if (x.type === 'M')
      ac.push({ point: x.values, vector: null })
    if (x.type === 'C') {
      ac[ac.length - 1].vector = [x.values[0], x.values[1]]
      ac.push({ point: [x.values[2], x.values[3]], vector: [x.values[4], x.values[5]] })
    }
    return ac
  }, [])

exports.divideInVector = divideInVector


// getPoints Object -> [[Number, Number]]
const getPoints = (pd) => pd.reduce((ac, x) => {
  let array = x.values
  while (array.length > 0) {
    ac.push([array[0], array[1]])
    array = array.slice(2)
  }
  return ac
}, [])
// listOfCircles :: [[Number, Number]] -> [CircleNode]
const listOfCircles = (list) => list.map(circleCreator)
const circleCreator = (a) => {
  const el = document.createElementNS(svgNS, 'circle')
  el.setAttribute('cx', a.x)
  el.setAttribute('cy', a.y)
  return el
}

const colorArray = ['green', 'blue', 'red', 'yellow', 'purple']
const colorIt = colorArray[Symbol.iterator]()
// colorize :: [CircleNode] -> color
const colorize = list => {
  // const color = colorArray.slice(countCol++ %colorArray.length)[0]
  const color = colorIt.next().value
  return list.map(x => {
    x.style.fill = color
    return x
  })
}

const pointsFragment = points => points.reduce((ac, x) => {
  ac.appendChild(x)
  return ac
}, document.createDocumentFragment())


// const datas = paths.map(x => x.getPathData())
//                       .map(pathDataToHandles)
// datas.forEach(x => {
//   svg.appendChild(x)
// })
