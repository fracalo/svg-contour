const assert = require('assert')
const lineIntersection = require('../src/utils/lineIntersection')


describe('intersection - common case', () => {
  it('should meet at 0,0', () => {
    const segA = [[-1, 1], [2, -2]]
    const segB = [[10, 10], [-2, -2]]

    const output = lineIntersection(segA, segB)
    assert.deepEqual(output, [0, 0])
  })
})

describe('intersection - one vertical', () => {
  it('should meet at 1,1', () => {
    const segA = [[-1, -1], [2, 2]]
    const segB = [[1, 0], [1, 20]]

    const output = lineIntersection(segA, segB)
    assert.deepEqual(output, [1, 1])
  })
})

describe('intersection - both vertical', () => {
  it('should return false, because they\'re parallel', () => {
    const segA = [[-1, -1], [-1, 2]]
    const segB = [[1, 0], [1, 20]]

    const output = lineIntersection(segA, segB)
    assert.equal(output, false)
  })
})

describe('intersection - both vertical2', () => {
  it('should return true, because the fuctions describe the same line', () => {
    const segA = [[1, -1], [1, 2]]
    const segB = [[1, 0], [1, 20]]

    const output = lineIntersection(segA, segB)
    assert.equal(output, true)
  })
})
describe('intersection - one horizontal', () => {
  it('should return -1,-1', () => {
    const segA = [[-11, -1], [1, -1]]
    const segB = [[1, 1], [-2, -2]]

    const output = lineIntersection(segA, segB)
    assert.deepEqual(output, [-1, -1])
  })
})

describe('intersection - both horizontal', () => {
  it('should return false, because they\'re parallel', () => {
    const segA = [[-1, -1], [2, -1]]
    const segB = [[20, 20], [1, 20]]

    const output = lineIntersection(segA, segB)
    assert.equal(output, false)
  })
})

describe('intersection - both horizontal2', () => {
  it('should return true, because the fuctions describe the same line', () => {
    const segA = [[-1, 20], [2, 20]]
    const segB = [[20, 20], [1, 20]]

    const output = lineIntersection(segA, segB)
    assert.equal(output, true)
  })
})
