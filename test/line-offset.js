import assert from 'assert'
import Line from '../src/utils/Line'
import Point from '../src/utils/Point'
import Segment from '../src/utils/Segment'


let point, line, line2


describe('point projection on m1 line', () => {
  before(() => {
      line = new Line(1, 20)
      line2 = line.offset(10)
  })
  it('offset line should have same m',() => {
    assert.equal(line.m, line2.m)
  })
  it('offset line should have inter = 31.4...',() => {
    const inter = Math.sqrt(2 * Math.pow(10, 2)) + line.inter // this is empiric
    assert.equal(line2.inter, inter)
  })
})
describe('negative on m1 line', () => {
  before(() => {
      line = new Line(1, 20)
      line2 = line.offset(-10)
  })
  it('offset line should have inter = 31.4...',() => {
    const inter = -Math.sqrt(2 * Math.pow(10, 2)) + line.inter // this is empiric
    assert.equal(line2.inter, inter)
  })
})
describe('point projection on vertical line', () => {
  before(() => {
      line = new Line(Infinity, 20)
      line2 = line.offset(10)
  })
  it('offset line should have same m',() => {
    assert.equal(line.m, line2.m)
  })
  it('offset line should have inter = 31.4...',() => {
    const inter = 10 // this is empiric
    assert.equal(line2.inter, inter)
  })
})


xdescribe('creation and interaection of standard with vertical segment offset', () => {
  let offset = -40, segA, lineA, vertSeg, vertLine
  before(() => {
    segA = new Segment([-100, 0], [0, -200])
    vertSeg = new Segment([0, -200], [0, 200])
    lineA = ne
  })
  it(('testing premises'), () => {
    assert.equal(segA.m, -2)
    assert.equal(vertSeg.m, Infinity)
  })
})
