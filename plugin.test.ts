import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as sources from './sources.ts'

const all = Object.entries(sources).filter(([, one]) => (one as { kind?: string }).kind === 'source')

test('it declares the sources it says it does', () => {
  assert.deepEqual(all.map(([name]) => name).sort(), ["yields"])
})

test('every source says what it is for, and which hosts it reaches', () => {
  for (const [name, source] of all) {
    const one = source as { description?: string; hosts?: string[] }
    assert.ok((one.description ?? '').length > 30, `${name} has no description worth reading`)
    assert.ok((one.hosts ?? []).length > 0, `${name} declares no hosts`)
    // A host is a bare hostname: the guarded fetch matches on it exactly.
    for (const host of one.hosts ?? []) assert.match(host, /^[a-z0-9-]+(\.[a-z0-9-]+)+$/, host)
  }
})
