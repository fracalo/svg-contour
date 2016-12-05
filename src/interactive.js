import Point from './utils/Point'
import Segment from './utils/Segment'
import { drawPoint } from './utils/draw'
import { getPoints } from './utils/contour-path-data'


const setUp = el => {
  const pathData = el.getPathData({ normalize: true })
  const points = getPoints(pathData)
    .map(drawPoint('navy'))

}


window.setUp = setUp
