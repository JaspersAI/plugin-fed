import { defineSource } from '@jaspers-ai/sdk'
import { z } from 'zod'

// The published SDK types a source's arguments as unknown, since from there it cannot see the
// schema beside them. Each run names what its own input parses to.
type Args = Record<string, any>

// The Federal Reserve Board's own data download, which answers CSV without a key. FRED is the
// friendlier way to the same numbers and wants a free key; this does not, so the yield curve is
// here for nothing.

const HOST = 'www.federalreserve.gov'
/** H.15, the daily selected interest rates release: the constant maturity Treasury curve. */
const H15 = 'bf17364827e38702b42a58cf8eaa3f78'
/** The maturities in the order the release gives them, which is the order a curve is read in. */
const TENORS = ['1m', '3m', '6m', '1y', '2y', '3y', '5y', '7y', '10y', '20y', '30y']

/** A CSV line, honouring the quotes the Fed writes its headings in. */
function cells(line: string): string[] {
  const out: string[] = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]!
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') { current += '"'; i++ }
      else if (char === '"') quoted = false
      else current += char
    } else if (char === '"') quoted = true
    else if (char === ',') { out.push(current); current = '' }
    else current += char
  }
  out.push(current)
  return out
}

export const yields = defineSource({
  description:
    'The US Treasury yield curve, daily, from the Fed\'s own H.15 release: the constant maturity yield at each tenor from one month to thirty years. One row per day, one column per tenor, so a row is a curve and a column is a series.',
  hosts: [HOST],
  input: z.object({ days: z.number().int().min(1).max(5000).default(90).describe('Trading days to read, newest last.') }),
  async run(raw, ctx) {
    const { days } = raw as Args
    const url = `https://${HOST}/datadownload/Output.aspx?rel=H15&series=${H15}&lastobs=${days}&filetype=csv&label=include&layout=seriescolumn`
    const response = await ctx.fetch(url, { headers: { 'User-Agent': 'Jaspers Terminal (https://jsprai.com)' } })
    if (!response.ok) throw new Error(`The Federal Reserve answered ${response.status}.`)
    const lines = (await response.text()).split(/\r?\n/).filter((line) => line.trim() !== '')
    // Five heading rows describe the series; the data starts where a line begins with a date.
    const start = lines.findIndex((line) => /^\d{4}-\d{2}-\d{2},/.test(line))
    if (start === -1) throw new Error('The Fed answered in a shape this does not know how to read.')
    const rows = lines.slice(start).map((line) => {
      const parts = cells(line)
      const row: Record<string, unknown> = { date: parts[0] }
      TENORS.forEach((tenor, index) => {
        const value = parts[index + 1]
        // The release writes ND on a day a rate was not published.
        row[tenor] = value && value !== 'ND' && Number.isFinite(Number(value)) ? Number(value) : null
      })
      // What everyone actually watches.
      row['10y-2y'] = typeof row['10y'] === 'number' && typeof row['2y'] === 'number' ? Number((row['10y'] - row['2y']).toFixed(2)) : null
      return row
    })
    return { tenors: TENORS, rows }
  },
})
