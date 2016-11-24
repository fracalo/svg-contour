const svgNS = 'http://www.w3.org/2000/svg'
const svg = document.querySelector('svg')
const pipe = require('./pipe')


const drawPoint = (p, col) => {
  const el = circleCreator(p)
  el.style.fill = col
  svg.appendChild(el)
}

exports.drawPoint = drawPoint

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
  el.setAttribute('cx', a[0])
  el.setAttribute('cy', a[1])
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

const pathDataToHandles = pipe(
  getPoints,
  listOfCircles,
  colorize,
  pointsFragment
)

// const datas = paths.map(x => x.getPathData())
//                       .map(pathDataToHandles)
// datas.forEach(x => {
//   svg.appendChild(x)
// })
