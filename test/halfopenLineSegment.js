import assert from 'assert'
import HalfopenLineSegment from '../src/utils/HalfopenLineSegment'

describe('HalfopenLineSegment', () => {
  let halfline1, halfline2, halfline3
  before(() => {
    halfline1 = new HalfopenLineSegment([-100,0], [-1, 200])
    halfline2 = new HalfopenLineSegment([100,0], [0, 200])
    halfline3 = new HalfopenLineSegment([-100,0], [1, -200])
  })
  it(' testing xCond', () => {
    assert(halfline1.xCond(-50))
    assert(! halfline1.xCond(-110))
  })
  it(' testing yCond', () => {
    assert(! halfline1.yCond(-1))
    assert(halfline1.yCond(1))
  })
  it(' should return intersection', () => {
    const intersection = halfline1.intersect(halfline2)
    assert(!! intersection)
  })
  it(' should return intersection', () => {
    const intersection = halfline3.intersect(halfline2)
    assert(! intersection)
  })
})

describe('parallel HalfopenLineSegment', () =>{
  let halfline1, halfline2
  before(() => {
  })
  it('shouldn\'t intersect 1', () => {
    halfline1 = new HalfopenLineSegment([-100,0], [0, -200])
    halfline2 = new HalfopenLineSegment([100,0], [0, 200])
    const intersection = halfline1.intersect(halfline2)
    assert(! intersection)
  })
  it('shouldn\'t intersect vertical', () => {
    halfline1 = new HalfopenLineSegment([-100,0], [-100, -200])
    halfline2 = new HalfopenLineSegment([100,0], [100, 200])
    const intersection = halfline1.intersect(halfline2)
    assert(! intersection)
  })
  it('shouldn\'t intersect horizontal', () => {
    halfline1 = new HalfopenLineSegment([0,-200], [-100, -200])
    halfline2 = new HalfopenLineSegment([-100,0], [100, 0])
    const intersection = halfline1.intersect(halfline2)
    assert(! intersection)
  })
})
