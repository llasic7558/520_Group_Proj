import { readFileSync } from 'node:fs'

const reports = [
  {
    name: 'Server',
    tool: 'c8 / V8 coverage with Node.js test runner',
    path: 'five_college_connect/server/coverage/lcov.info',
  },
  {
    name: 'Client',
    tool: 'Vitest with @vitest/coverage-v8',
    path: 'five_college_connect/client/coverage/lcov.info',
  },
]

function parseLcov(path) {
  const content = readFileSync(path, 'utf8')
  let total = 0
  let covered = 0

  for (const line of content.split('\n')) {
    if (!line.startsWith('DA:')) {
      continue
    }

    const [, hits] = line.slice(3).split(',')
    total += 1
    if (Number(hits) > 0) {
      covered += 1
    }
  }

  return { covered, total }
}

function formatPercent(covered, total) {
  return total === 0 ? '0.00%' : `${((covered / total) * 100).toFixed(2)}%`
}

const summaries = reports.map((report) => ({
  ...report,
  ...parseLcov(report.path),
}))

const overall = summaries.reduce(
  (accumulator, summary) => ({
    covered: accumulator.covered + summary.covered,
    total: accumulator.total + summary.total,
  }),
  { covered: 0, total: 0 },
)

console.log('\nCoverage summary')
for (const summary of summaries) {
  console.log(
    `${summary.name}: ${formatPercent(summary.covered, summary.total)} ` +
      `(${summary.covered}/${summary.total} lines) using ${summary.tool}`,
  )
}

console.log(
  `Overall line coverage: ${formatPercent(overall.covered, overall.total)} ` +
    `(${overall.covered}/${overall.total} lines)`,
)
