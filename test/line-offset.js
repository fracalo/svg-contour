const assert = require('assert')
const Line = require('../src/utils/line')
const Point = require('../src/utils/point')


let point, line


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
