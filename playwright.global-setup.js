import { execSync } from 'node:child_process'

export default async function globalSetup() {
  try {
    execSync('npm run db:up', {
      stdio: 'inherit',
      env: process.env,
    })
  } catch (error) {
    throw new Error(
      'Failed to start the local Postgres service for Playwright. Run `npm run db:up` and verify Docker is available before rerunning the e2e suite.',
      { cause: error },
    )
  }
}
