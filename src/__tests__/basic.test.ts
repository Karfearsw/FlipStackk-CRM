import { describe, it, expect } from 'vitest'

describe('Basic Math', () => {
  it('should add numbers correctly', () => {
    expect(1 + 1).toBe(2)
  })

  it('should multiply numbers correctly', () => {
    expect(2 * 3).toBe(6)
  })

  it('should handle string operations', () => {
    expect('hello' + ' world').toBe('hello world')
  })
})

describe('Array Operations', () => {
  it('should find items in arrays', () => {
    const fruits = ['apple', 'banana', 'orange']
    expect(fruits).toContain('banana')
  })

  it('should filter arrays', () => {
    const numbers = [1, 2, 3, 4, 5]
    const even = numbers.filter(n => n % 2 === 0)
    expect(even).toEqual([2, 4])
  })
})

describe('Object Operations', () => {
  it('should access object properties', () => {
    const user = { name: 'John', age: 30 }
    expect(user.name).toBe('John')
    expect(user.age).toBe(30)
  })

  it('should check if property exists', () => {
    const car = { make: 'Toyota', model: 'Camry' }
    expect(car).toHaveProperty('make')
    expect(car).toHaveProperty('model')
  })
})