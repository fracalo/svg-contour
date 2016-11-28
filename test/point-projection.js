const assert = require('assert')
const Line = require('../src/utils/line')
const Point = require('../src/utils/point')


let point, line


describe('point projection on line', () => {
  before(() => {
    point = new Point(0, 0)
  })
  it('should project on 1,1',() => {
    line = new Line(1, 2)
    assert.deepEqual(line.projection(point), new Point(-1,1))
  })
  it('vertical line x - 2 | should project on 2,0',() => {
    line = new Line(Infinity, 2)
    assert.deepEqual(line.projection(point), new Point(2,0))
  })
  it('horizontal line y = 3 || project on 0,3',() => {
    line = new Line(0, 3)
    assert.deepEqual(line.projection(point), new Point(0,3))
  })
})
