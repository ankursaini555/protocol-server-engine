import { createLogger, format, transports } from "winston";
import LokiTransport from "winston-loki";
require("winston-daily-rotate-file");
const { combine, timestamp, printf, colorize } = format;
// const config = require("./config");

var logger: any;

function init() {
  if (logger == undefined) {
    getLogger();
  }
  return logger;
}

function getLogger() {
  const myFormat = printf(({ level, message, timestamp, uuid }) => {
    return `[${uuid}] [${timestamp}] [${level}]: ${message}`;
  });
  
if(process.env.USE_LOKI){
  logger = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(timestamp(), colorize(), myFormat),
    transports: [
      new LokiTransport({
        host: process.env.LOKI_HOST as string,
        labels: {
          app:
            process.env.LOKI_APP_NAME ||
            `infra_dev
          `,
        },
        json: true,
        format: format.json(),
        replaceTimestamp: true,
        onConnectionError: (err: any) => logger.error(err),
      }),
      new transports.Console({
        format: combine(timestamp(), colorize(), myFormat),
      }),
    ],
  });
}else{
  logger = createLogger({
    level: `{
      log: {
        level: "DEBUG",
        output_type: "file",
        out_file: "/logs/log_file.log",
      },
    }`,

    format: combine(timestamp(), colorize(), myFormat),
    transports: [
      new transports.Console({
        level: "debug",
      }),
      new transports.Console(),
    ],
  });
}
  return logger;
}

module.exports = { init };
