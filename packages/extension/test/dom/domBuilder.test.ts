import { describe, expect, it, vi } from 'vitest'
import { h } from '../../src/dom'

/** The injected UIs are built entirely through `h`; a regression here shows up
 * everywhere at once, so cover its prop handling in isolation. */
describe('h (DOM builder)', () => {
  it('sets class, text and arbitrary attributes', () => {
    const el = h('div', { class: 'panel', text: 'Diagram', title: 'BPMN' })
    expect(el.tagName).toBe('DIV')
    expect(el.className).toBe('panel')
    expect(el.textContent).toBe('Diagram')
    expect(el.getAttribute('title')).toBe('BPMN')
  })

  it('skips null/undefined props', () => {
    const el = h('div', { class: undefined, title: null as unknown as string })
    expect(el.className).toBe('')
    expect(el.hasAttribute('title')).toBe(false)
  })

  it('wires on* props as event listeners', () => {
    const onClick = vi.fn()
    const el = h('button', { onClick })
    el.dispatchEvent(new Event('click'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('appends element and string children', () => {
    const child = h('span', { text: 'x' })
    const el = h('div', {}, [child, ' y'])
    expect(el.children).toHaveLength(1)
    expect(el.firstElementChild).toBe(child)
    expect(el.textContent).toBe('x y')
  })
})
