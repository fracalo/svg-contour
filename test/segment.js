const assert = require('assert')
const Line = require('../src/utils/line')
const Segment = require('../src/utils/segment')
const Point = require('../src/utils/point')

let line, seg;



describe('vertical line', () => {
  before(() => {
    seg = new Segment([1, 0], [1, 20])
    line = seg.line()
  })
  it('should be vertical', () => {
    assert.equal(line.vertical, true)
  })
  it('should have m == Infinity', () => {
    assert(! isFinite(line.m))
  })
  it('should have  inter of 1', () => {
    assert.equal(line.inter, 1)
  })
})
describe('standare line', () => {
  before(() => {
    seg = new Segment([0,2], [5, 0])
    line = seg.line()
  })
  it('should have m == -2/5', () => {
    assert.equal(-2/5, line.m)
  })
  it('should have  inter of 2', () => {
    assert.equal(line.inter, 2)
  })
})
describe('standare line2', () => {
  before(() => {
    seg = new Segment([-2,0], [0, 2])
    line = seg.line()
  })
  it('should have m == 1', () => {
    assert(line.m === 1)
  })
  it('should have  inter of 2', () => {
    assert.equal(line.inter, 2)
  })
})
describe('zeroLength', () => {
  before(() => {
    seg = new Segment([-2,0], [-2, 0])
  })
  it('zeroLength true', () => {
    assert(seg.zeroLength())
  })
})
