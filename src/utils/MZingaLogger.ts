import pino from "pino";
const env = () => {
  const _w = typeof window !== "undefined" ? window : process;
  const _env_ = (_w as any)._env_ || (_w as any).env || {};
  return _env_;
};
let _logger: pino.Logger;
export const MZingaLogger = {
  LoggerOptions: {
    level: env().PAYLOAD_LOG_LEVEL || "info",
  },
  get Instance() {
    if (_logger) {
      return _logger;
    }
    _logger = pino(MZingaLogger.LoggerOptions, null);
    return _logger;
  },
};
