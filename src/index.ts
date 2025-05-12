import express from "express";
import bodyParser from "body-parser";
import { router } from "./router/router";
const app = express();
import connectDB from "./core/db";
require("dotenv").config();

import { configLoader } from "./core/loadConfig";
import { parseBoolean } from "./utils/utils";

// import { contextValidation } from "./core/contextValidation";
// import PayloadModule from "./core/payloadModule";
// import ondc from "ondc-payload-module";

const logger = require("./utils/logger").init();

const USE_DB = parseBoolean(process.env.USE_DB);
const PORT = process.env.PORT;
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.json());

configLoader
  .init()
  .then((data: any) => {
    logger.info(`Config loaded successfully.....`, { uuid: "asdad" });

    if (USE_DB) {
      connectDB();
    }
    app.use(router);

    app.listen(PORT, () => {
      logger.info("server listening at port " + PORT);
    });
  })
  .catch((e: any) => {
    logger.error("Error loading config file:", e);
  });
