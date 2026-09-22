import { describe, expect, it } from 'vitest'
import { hasHistoryEntry } from './backGuard'

describe('hasHistoryEntry', () => {
  it('is true once react-router has stepped forward from the first entry', () => {
    expect(hasHistoryEntry({idx: 1})).toBe(true)
    expect(hasHistoryEntry({idx: 7, key: 'abc'})).toBe(true)
  })

  it('is false on the first entry, where back would exit the app', () => {
    // 直接打开深链时 idx 是 0；此时 history.back() 会关掉 WebView
    expect(hasHistoryEntry({idx: 0})).toBe(false)
    expect(hasHistoryEntry({idx: -1})).toBe(false)
  })

  it('is false when there is no router state at all', () => {
    expect(hasHistoryEntry(null)).toBe(false)
    expect(hasHistoryEntry(undefined)).toBe(false)
    expect(hasHistoryEntry({})).toBe(false)
    expect(hasHistoryEntry({__azurpilotOverlay: true})).toBe(false)
  })

  it('ignores a non-numeric idx instead of guessing', () => {
    expect(hasHistoryEntry({idx: '3'})).toBe(false)
    expect(hasHistoryEntry({idx: null})).toBe(false)
  })

  it('rejects primitives rather than throwing', () => {
    expect(hasHistoryEntry('idx')).toBe(false)
    expect(hasHistoryEntry(3)).toBe(false)
    expect(hasHistoryEntry(true)).toBe(false)
  })
})
