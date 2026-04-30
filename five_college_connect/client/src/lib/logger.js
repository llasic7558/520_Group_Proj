const PREFIX = '[FiveCollegeConnect]'

function logWith(level, message, context) {
  const writer = console[level] || console.log

  if (context && Object.keys(context).length > 0) {
    writer(PREFIX, message, context)
    return
  }

  writer(PREFIX, message)
}

export function logInfo(message, context = {}) {
  logWith('info', message, context)
}

export function logWarn(message, context = {}) {
  logWith('warn', message, context)
}

export function logError(message, context = {}) {
  logWith('error', message, context)
}
