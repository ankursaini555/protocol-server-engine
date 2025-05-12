import axios from "axios";
import { createBecknObject, extractBusinessData } from "../core/mapper_core";
import {
  insertSession,
  getSession,
  generateSession,
  findSession,
} from "../core/session";
import { generateHeader, verifyHeader } from "../core/auth_core";
import { cache } from "../core/cache";
import { parseBoolean, jsonout, buildNackPayload } from "../utils/utils";
const IS_VERIFY_AUTH = parseBoolean(process.env.IS_VERIFY_AUTH);
const IS_SYNC = parseBoolean(process.env.BUSINESS_SERVER_IS_SYNC);

import { validateSchema } from "../core/schema";
const SERVER_TYPE = process.env.SERVER_TYPE;
const PROTOCOL_SERVER = process.env.PROTOCOL_SERVER;
const logger = require("../utils/logger").init();
import { signNack, errorNack, ack } from "../utils/responses";
import { dynamicReponse, dynamicFlow } from "../core/operations/main";
import { configLoader } from "../core/loadConfig";
import validateAttributes from "../core/attributeValidation";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

const ASYNC_MODE = "ASYNC";
const SYNC_MODE = "SYNC";

export const getsession = async (req: Request, res: Response) => {
  const logID = uuidv4();
  logger.info("/session api controller", { uuid: logID });
  res.send(await cache.get());
  logger.info("/session api executed", { uuid: logID });
};

// beckn-business-1
export const becknToBusiness = (req: Request, res: Response) => {
  const logID = uuidv4();
  const body = req.body;
  const transaction_id = body?.context?.transaction_id;
  const config = body.context.action;

  validateIncommingRequest(body, transaction_id, config, res, logID);
};

//beckn-business-2
const validateIncommingRequest = async (
  body: Record<string, any>,
  transaction_id: string,
  config: any,
  res: Response,
  logID: any
) => {
  try {
    if (IS_VERIFY_AUTH !== false) {
      if (!(await verifyHeader(body))) {
        return res.status(401).send(signNack);
      }
    }

    let session = null;
    let sessionId = null;

    if (SERVER_TYPE === "BPP") {
      session = await getSession(transaction_id);

      const configObject = configLoader.getConfig();    

      if (!session) {

        const flow_selector_config = configObject[SERVER_TYPE]["flow_selector"][config]
        if(flow_selector_config==undefined) {logger.error(`action : ${config} not found in the flow_selector unable to assign config-name`); logger.info(`available actions in flow-selector are -  ${Object.keys(configObject[SERVER_TYPE]["flow_selector"])}`); logger.error(`terminating the call for transaction_id - ${transaction_id}`);return res.status(400).send({message:"session id not found please create session first , make sure you are using the same transaction_id that you created session with"});}
        var configName = dynamicFlow(
          body,
          flow_selector_config
        )
        const sessionObject = {
          version: body.context.version,
          country: body?.context?.location?.country?.code,
          cityCode: body?.context?.location?.city?.code,
          configName: configName || process.env.flow,
          transaction_id: transaction_id
      }
        logger.info(`New request recieved creating new session ${JSON.stringify(sessionObject)}`)

        await generateSession(sessionObject);
        session = await getSession(transaction_id);
      }
    } else {
      session = await findSession(body);

      if (!session) {
        logger.info("No session exists");
        return res.status(200).send(errorNack);
      }
    }


    const schemaConfig = configLoader.getSchema();

    if (schemaConfig[config]) {
      const schema = schemaConfig[config];
      const schemaValidation = await validateSchema(body, schema);

      if (!schemaValidation?.status && schemaValidation?.message) {
        return res.status(200).send(buildNackPayload(schemaValidation.message));
      }
    } else {
      logger.info(`Schema config missing for ${config}`);
    }

    const attributeConfig = configLoader.getAttributeConfig(session.configName);

    if (attributeConfig) {
      const attrErrors = validateAttributes(
        body,
        attributeConfig[config],
        config
      );

      if (attrErrors.length) {
        logger.error("Attribute validation failed: " + attrErrors);
        // return res
        //   .status(200)
        //   .send(buildNackPayload(JSON.stringify(attrErrors)));
      } else {
        logger.info("Attribute validation SUCCESS");
      }
    } else {
      logger.info(`Attribute config missing for ${session.configName}`);
    }

    logger.info(`/ondc/:method api - response sent back`);
    res.send(ack);
    handleRequest(body, session, sessionId ?? "");
  } catch (err: any) {
    logger.error(`/ondc:method error - ${err?.data?.message || err}`, {
      uuid: logID,
    });
  }
};

//beckn-business-3
const handleRequest = async (
  response: any,
  session: any,
  sessionId: string
) => {
  try {
    const action = response?.context?.action;
    const messageId = response?.context?.message_id;
    const is_buyer = SERVER_TYPE === "BAP" ? true : false;
    if (!action) {
      return console.log("Action not defined");
    }

    if (!messageId) {
      return console.log("Message ID not defined");
    }

    if (is_buyer) {
      let config = null;
      let isUnsolicited = true;

      session.calls.map((call: any) => {
        if (call.callback?.message_id?.includes(response.context.message_id)) {
          config = call.callback?.config;
          isUnsolicited = false;
        }
      });

      if (isUnsolicited) {
        config = action;
      }


      const mapping = configLoader.getMapping(session.configName);
      const protocol = mapping ? mapping[config] : null;

      const { result: businessPayload, session: updatedSession } =
        extractBusinessData(action, response, session, protocol);

      businessPayload.context = {};
      businessPayload.context.message_id = response.context.message_id;

      let urlEndpint = null;
      let mode = ASYNC_MODE;

      const updatedCalls = updatedSession.calls.map((call: any) => {
        if (isUnsolicited && call.callback.config === action) {
          call.callback.unsolicited = [
            ...(call.callback.unsolicited || []),
            response,
          ];
          urlEndpint = call.callback.unsolicitedEndpoint;
        }

        if (call.callback?.message_id?.includes(response.context.message_id)) {
          call.callback.becknPayload = [
            ...(call.callback.becknPayload || []),
            response,
          ];
          call.callback.businessPayload = [
            ...(call.callback.businessPayload || []),
            businessPayload,
          ];
          urlEndpint = call.callback.endpoint;
          mode = call?.mode || ASYNC_MODE;
        }

        return call;
      });

      updatedSession.calls = updatedCalls;

      insertSession(updatedSession);

      if (updatedSession?.schema) {
        delete updatedSession.schema;
      }

      if (mode === ASYNC_MODE) {
        await axios.post(`${process.env.BACKEND_SERVER_URL}/${urlEndpint}`, {
          businessPayload,
          updatedSession,
          messageId,
          sessionId,
          response,
        });
      }
    } else {
      let config = null;
      let isUnsolicited = true;

    if (isUnsolicited || true) {
      config = action;
      }

      console.log("config >>>>>", config);

      const mapping : any = configLoader.getMapping(session.configName);
      const protocol = mapping ? mapping[config] : null;
      if(protocol == undefined){
        logger.error(`Protocol is undefined / action type not found in protocol-mapping \n recieved action = ${config}`)
        logger.error(`Available protocol-mapping actions are \n ${Object.keys(mapping)}`)
        return
      }
      const { result: businessPayload, session: updatedSession } =
        extractBusinessData(action, response, session, protocol);

      let urlEndpint = null;
      let mode = ASYNC_MODE;

      const updatedCalls = updatedSession.calls.map((call: any) => {
        // unsolicated check if message id not found
        if (isUnsolicited && call.callback.config === action) {
          call.callback.unsolicited = [
            ...(call.callback.unsolicited || []),
            response,
          ];
          urlEndpint = call.callback.unsolicitedEndpoint;
        }

        if (
          call.callback?.message_id === response.context.message_id ||
          call.unsolicated === false
        ) {
          call.callback.becknPayload = [
            ...(call.callback.becknPayload || []), // storing payload
            response,
          ];
          call.callback.businessPayload = [
            ...(call.callback.businessPayload || []),
            businessPayload,
          ];
          urlEndpint = call.callback.endpoint;
          mode = call?.mode || ASYNC_MODE;
        }

        return call;
      });

      updatedSession.calls = updatedCalls;

      insertSession(updatedSession);

      if (updatedSession?.schema) {
        delete updatedSession.schema;
      }

      if(protocol?.status){
        const on_action = `on_${config}`
        const body : any = {
          type: on_action,
          config: on_action,
          transactionId:response?.context?.transaction_id
        }
        const { status, message, code } = await businessToBecknMethod(body,uuidv4()) as any
        return
      }      
      if (mode === ASYNC_MODE) {
        logger.info (`triggering seller mock engine call at ${process.env.BACKEND_SERVER_URL}/${urlEndpint} `)
        await axios.post(`${process.env.BACKEND_SERVER_URL}/${urlEndpint}`, {
          businessPayload, // minified response of response || extract method in buyer mock works on this payload extracts from business payload
          updatedSession, // updated session after sessionData config has been processed
          messageId, // message id not being used in bpp
          sessionId, // protocol server transaction id not being used in bpp mode
          response,
        });
      }
    }
    // throw new Error("an error occurred")
  } catch (e) {
    logger.error(e);
  }
};


// business-beckn-1
export const businessToBecknWrapper = async (req: Request, res: Response) => {
  const logID = uuidv4();
  logger.info("/createPayload api controller", { uuid: logID });
  try {
    const body = req.body;
    logger.debug(`/createPayload api payload ${JSON.stringify(body)}`, {
      uuid: logID,
    });
    const { status, message, code } = (await businessToBecknMethod(
      body,
      logID
    )) as any;
    if (message?.updatedSession?.schema) {
      delete message.updatedSession.schema;
    }
    logger.info("/createPayload api executed", { uuid: logID });
    res.status(code).send({ status: status, message: message });
  } catch (e: any) {
    logger.info(`/createPayload error - ${e?.message || e}`, { uuid: logID });
    res.status(500).send({ error: true, message: e?.message || e });
  }
};

// business-beckn-2
export const businessToBecknMethod = async (body: any, logID: any) => {
  try {
    //except target i can fetch rest from my payload
    let { type, config, data, transactionId, target, configName, ui } = body;
    let seller = false;
    if (SERVER_TYPE === "BPP") {
      seller = true;
    }

    let session = body.session;

    ////////////// session validation ////////////////////
    if (session && session.createSession && session.data) {
      logger.info("/createPayload api - Genenrating session", { uuid: logID });
      await generateSession({
        country: session.data.country,
        cityCode: session.data.cityCode,
        bpp_id: session.data.bpp_id,
        configName: configName,
        transaction_id: transactionId,
      });
      session = await getSession(transactionId);
    } else {
      logger.info("/createPayload api - Retrieving session", { uuid: logID });
      session = await getSession(transactionId); // session will be premade with beckn to business usecase

      if (!session) {
        logger.error("/createPayload api - session not found", { uuid: logID });
        return {
          status: "Bad Request",
          message: "session not found",
          code: 400,
        };
        //   return res.status(400).send({ error: "session not found" }); ------->
      }
    }

    if (SERVER_TYPE === "BAP") {
      session = { ...session, ...data };
    }

    const mapping = configLoader.getMapping(session.configName);
    const protocol = mapping ? mapping[config] : null;

    logger.info("/createPayload api - Creating beckn object", { uuid: logID });
    const { payload: becknPayload, session: updatedSession } =
      createBecknObject(session, type, data, protocol);
    logger.debug(`/createPayload api - beckn object - ${becknPayload}`, {
      uuid: logID,
    });

    if (!seller) {
      becknPayload.context.bap_uri = `${process.env.SUBSCRIBER_URL}/ondc`;
    }

    let url;

    const GATEWAY_URL = process.env.GATEWAY_URL;

    if (target === "GATEWAY") {
      url = GATEWAY_URL;
    } else {
      url =
        SERVER_TYPE === "BPP"
          ? session.dualmode && session.url ? session.url 
            : becknPayload.context.bap_uri
          : becknPayload.context.bpp_uri;
    }
    if(session.dualmode && session.url){logger.debug("dual mode failed triggering back to bap_uri")}
    if (!url && type != "search") {
      logger.error("/createPayload api - callback url not provided", {
        uuid: logID,
      });
      return {
        status: "Bad Request",
        message: "callback url not provided",
        code: 400,
      };
    }
    if (url[url.length - 1] != "/") {
      url = url + "/";
    }

    logger.info("/createPayload api - Creating header", { uuid: logID });
    const signedHeader = await generateHeader(becknPayload);
    logger.debug(`/createPayload api - header - ${signedHeader}`, {
      uuid: logID,
    });

    const header = { headers: { Authorization: signedHeader } };

    logger.info(`/createPayload api - sending request to gateway`, {
      uuid: logID,
      url : `${url}${type}`
    });
    const response = await axios.post(`${url}${type}`, becknPayload, header);

    let mode = null;
    if (SERVER_TYPE === "BAP") {
      const updatedCalls = updatedSession.calls.map((call: any) => {
        const message_id = becknPayload.context.message_id;
        if (call.config === config) {
          call.becknPayload = [...(call?.becknPayload || []), becknPayload];
          mode = call?.mode || ASYNC_MODE;
          call.callback.message_id = [
            ...(call.callback?.message_id || []),
            message_id,
          ];
        }

        return call;
      });

      updatedSession.calls = updatedCalls;
    }

    insertSession(updatedSession);

    logger.info(`/createPayload api - mode - ${mode}`, { uuid: logID });
    if (mode === SYNC_MODE) {
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          const newSession = await getSession(transactionId);
          let businessPayload = null;
          let onBecknPayload = null;

          newSession.calls.map((call: any) => {
            if (call.config === config) {
              businessPayload = call.callback.businessPayload;
              onBecknPayload = call.callback.becknPayload;
            }
          });

          const becknPayloads = {
            action: becknPayload,
            on_action: onBecknPayload,
          };

          if (!businessPayload) {
            logger.error("/createPayload api error - Response timeout ", {
              uuid: logID,
            });
            reject("Response timeout");
          }

          resolve({
            status: "true",
            message: {
              updatedSession: newSession,
              becknPayload: becknPayloads,
              businessPayload,
            },
            code: 200,
          });
        }, 7000);
      });
    } else {
      return {
        status: "true",
        message: {
          updatedSession,
          becknPayload,
          becknReponse: response.data,
        },
        code: 200,
      };

      // res.send({ updatedSession, becknPayload, becknReponse: response.data });
    }
  } catch (e: any) {
    logger.error(`/createPayload - error - ${e?.message || e}`, {
      uuid: logID,
    });
    const errorMessage = {
      message: {
        ack: {
          status: "NACK",
        },
      },
      error: {
        message: e?.message,
      },
    }
    return { status: "Error", message: errorMessage, code: 500 };
  }
};

export const updateSession = async (req: Request, res: Response) => {
  const logID = uuidv4();
  logger.info("/updateSession api controller", { uuid: logID });
  const { sessionData, transactionId } = req.body;
  logger.debug(`/updateSession api payload - ${JSON.stringify(req.body)}`, {
    uuid: logID,
  });
  if (!sessionData || !transactionId) {
    logger.error(
      `/updateSession api error - sessionData || transcationID required`,
      { uuid: logID }
    );
    return res
      .status(400)
      .send({ message: "sessionData || transcationID required" });
  }

  const session = await getSession(transactionId);

  if (!session) {
    logger.error(`/updateSession api error - No session found`, {
      uuid: logID,
    });
    return res.status(400).send({ message: "No session found" });
  }

  insertSession({ ...session, ...sessionData });

  logger.info("/updateSession api executed", { uuid: logID });
  res.send({ message: "session updated" });
};

// module.exports = {
//   becknToBusiness,
//   businessToBecknMethod,
//   businessToBecknWrapper,
//   updateSession,
// };


