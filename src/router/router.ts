import express, { Request, Response } from "express";
import { healthCheckAPI } from "../controller/health.controller";
import {
  becknToBusiness,
  businessToBecknWrapper,
  getsession,
  updateSession,
} from "../controller/index";
import { verifyHeader } from "../core/auth_core";

export const router = express.Router();
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

// self health check route
router.get("/health-self", (req: Request, res: Response) => {
  res.status(200).send(`STATUS:UP,TIMESTAMP:${new Date().toISOString()}`);
});

router.get("/session", getsession);
