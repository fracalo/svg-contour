// import assert from 'assert'
import { assert , expect } from 'chai'

import Line from '../src/utils/Line'
import Segment from '../src/utils/Segment'
import Point from '../src/utils/Point'



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
  it('should throw, because they\'re parallel', function() {
    expect(() => {
      const segAline =  new Segment([-1, -1], [-1, 2]).line()
      const segBline =  new Segment([1, 0], [1, 20]).line()

      segAline.intersection(segBline)

    }).to.throw(/parallel vert/) // using regex to match
  })
})

describe('intersection - both vertical2', () => {
  it('should return undefined, because not center fallback is provided', () => {
    const segAline =  new Segment([1, -1], [1, 2]).line()
    const segBline =  new Segment([1, 0], [1, 20]).line()

    const output = segAline.intersection(segBline)
    assert.equal(output, undefined)
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
    expect(() => {
      const segAline =  new Segment([-1, -1], [2, -1]).line()
      const segBline =  new Segment([20, 20], [1, 20]).line()

      segAline.intersection(segBline)
    }).to.throw(/parallel/) // using regex to match
  })
})

describe('intersection - both horizontal2', () => {
  it('should return true, because the fuctions describe the same line', () => {
    expect(() => {
      const segAline =  new Segment([-1, 20], [2, 20]).line()
      const segBline =  new Segment([20, 20], [1, 20]).line()

      segAline.intersection(segBline)
    }).to.throw('same lines don\'t intersect - if center is set it will be used as fallback') // using regex to match
  })
})

describe('intersection - 2 vertical with same inter (the same line), should use a center as fallback', () => {
  let lineCenter ,line, p, segB, segBLine, segBLineOffset, intersection

  before(() => {
    lineCenter = new Point(315, 87.5)
    line =  new Line(-Infinity, 315, lineCenter)
    p = new Point(275, 87.5)
    segB =  new Segment(p, [275, 50])
    segBLine = segB.line(p)
    segBLineOffset = segBLine.offset(40, segB.reverse)
    intersection = line.intersection(segBLineOffset)
  })
  it('should ...', () => {
    assert.equal(line.inter, segBLineOffset.inter)
    assert.equal(segB.reverse, true)
    assert.deepEqual(segBLineOffset.center, new Point(315, 87.5))
    assert.deepEqual(line.center, new Point(315, 87.5))
    assert.deepEqual(intersection, lineCenter)
  })
})
