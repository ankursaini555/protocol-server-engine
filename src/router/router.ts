import express from "express";
import { Request, Response } from "express";
import { verifyHeader } from "../core/auth_core";

export const router = express.Router();
import {
  becknToBusiness,
  businessToBecknWrapper,
  updateSession,
  getsession,
} from "../controller/index";
import { healthCheckAPI } from "../controller/health.controller";
const logger = require("../utils/logger").init();

// buss > beckn
router.post("/createPayload", businessToBecknWrapper);

// bkn > buss
router.post("/ondc/:method", becknToBusiness);

router.post("/updateSession", updateSession);

router.post("/validate_header", async (req, res) => {
  const validate = await verifyHeader(req);
  // if(validate){

  // }
});

// route for check halth of the service
router.get("/health", healthCheckAPI);

router.get("/health-test", (req: Request, res: Response) => {
  res.status(200).send({
    status: "Service is running",
    timestamp: new Date().toISOString(),
  });
});

router.get("/session", getsession);
