const assert = require('assert')
const Line = require('../src/utils/line')
const Segment = require('../src/utils/segment')
const Point = require('../src/utils/point')


describe('intersection - common case', () => {
  it('should meet at 0,0', () => {
    const segAline = new Segment([-1, 1], [2, -2]).line()
    const segBline = new Segment([10, 10], [-2, -2]).line()

    const output = segAline.intersection(segBline)
    assert.deepEqual(output, new Point(0, 0))
  })
})

describe('intersection - one vertical', () => {
  it('should meet at 1,1', () => {
    const segAline =  new Segment([-1, -1], [2, 2]).line()
    const segBline =  new Segment([1, 0], [1, 20]).line()

    const output = segAline.intersection(segBline)
    assert.deepEqual(output, new Point(1, 1))
  })
})

describe('intersection - both vertical', () => {
  it('should return false, because they\'re parallel', () => {
    const segAline =  new Segment([-1, -1], [-1, 2]).line()
    const segBline =  new Segment([1, 0], [1, 20]).line()

    const output = segAline.intersection(segBline)
    assert.equal(output, false)
  })
})

describe('intersection - both vertical2', () => {
  it('should return true, because the fuctions describe the same line', () => {
    const segAline =  new Segment([1, -1], [1, 2]).line()
    const segBline =  new Segment([1, 0], [1, 20]).line()

    const output = segAline.intersection(segBline)
    assert.equal(output, true)
  })
})
describe('intersection - one horizontal', () => {
  it('should return -1,-1', () => {
    const segAline =  new Segment([-11, -1], [1, -1]).line()
    const segBline =  new Segment([1, 1], [-2, -2]).line()

    const output = segAline.intersection(segBline)
    assert.deepEqual(output, new Point(-1, -1))
  })
})

describe('intersection - both horizontal', () => {
  it('should return false, because they\'re parallel', () => {
    const segAline =  new Segment([-1, -1], [2, -1]).line()
    const segBline =  new Segment([20, 20], [1, 20]).line()

    const output = segAline.intersection(segBline)
    assert.equal(output, false)
  })
})

describe('intersection - both horizontal2', () => {
  it('should return true, because the fuctions describe the same line', () => {
    const segAline =  new Segment([-1, 20], [2, 20]).line()
    const segBline =  new Segment([20, 20], [1, 20]).line()

    const output = segAline.intersection(segBline)
    assert.equal(output, true)
  })
})
