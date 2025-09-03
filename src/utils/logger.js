const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    let formattedMessage = `${prefix} ${message}`;
    
    if (data && typeof data === 'object') {
      formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
    } else if (data) {
      formattedMessage += ` ${data}`;
    }
    
    return formattedMessage;
  }

  colorize(color, text) {
    return this.isDevelopment ? `${color}${text}${colors.reset}` : text;
  }

  info(message, data = null) {
    const formatted = this.formatMessage('info', message, data);
    console.log(this.colorize(colors.cyan, formatted));
  }

  error(message, data = null) {
    const formatted = this.formatMessage('error', message, data);
    console.error(this.colorize(colors.red, formatted));
  }

  warn(message, data = null) {
    const formatted = this.formatMessage('warn', message, data);
    console.warn(this.colorize(colors.yellow, formatted));
  }

  debug(message, data = null) {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('debug', message, data);
      console.log(this.colorize(colors.magenta, formatted));
    }
  }

  success(message, data = null) {
    const formatted = this.formatMessage('success', message, data);
    console.log(this.colorize(colors.green, formatted));
  }

  http(method, url, statusCode, responseTime) {
    const message = `${method} ${url} ${statusCode} - ${responseTime}ms`;
    const color = statusCode >= 400 ? colors.red : 
                  statusCode >= 300 ? colors.yellow : colors.green;
    
    const formatted = this.formatMessage('http', message);
    console.log(this.colorize(color, formatted));
  }
}

module.exports = new Logger();