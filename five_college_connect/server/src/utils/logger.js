const PREFIX = "[FiveCollegeConnect:server]";

function write(method, message, context) {
  const logger = console[method] || console.log;

  if (context && Object.keys(context).length > 0) {
    logger(PREFIX, message, context);
    return;
  }

  logger(PREFIX, message);
}

export function logInfo(message, context = {}) {
  write("info", message, context);
}

export function logWarn(message, context = {}) {
  write("warn", message, context);
}

export function logError(message, context = {}) {
  write("error", message, context);
}
