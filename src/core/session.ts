import { cache } from "./cache";
import fs from "fs";
import yaml from "yaml";
import path from "path";
import $RefParser from "@apidevtools/json-schema-ref-parser";
import { parseBoolean } from "../utils/utils";
import { configLoader } from "./loadConfig";
const localConfig = parseBoolean(process.env.localConfig);
const SERVER_TYPE = process.env.SERVER_TYPE;

export const insertSession = async (session: any) => {
  await cache.set(session.transaction_id, session, 86400);
};

export const getSession = async (transaction_id: string) => {
  return await cache.get(transaction_id);
};


const getConfigBasedOnFlow = async (flowId: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const config = (configLoader.getConfig()[process.env.SERVER_TYPE as string]) as any;
      let filteredProtocol = null;
      let filteredCalls = null;
      let filteredDomain = null;
      let filteredSessiondata = null;
      let filteredAdditionalFlows = null;
      let filteredsummary = "";
      let filteredSchema = null;
      let filteredApi = null;

      config.flows.forEach((flow: any) => {
        if (flow.id === flowId) {
          const {
            protocol,
            calls,
            domain,
            sessionData,
            additioalFlows,
            summary,
            schema,
            api,
          } = flow;

          filteredProtocol = protocol;
          filteredCalls = calls;
          filteredDomain = domain;
          filteredSessiondata = sessionData;
          filteredAdditionalFlows = additioalFlows || [];
          filteredsummary = summary;
          (filteredSchema = schema), (filteredApi = api);
        }
      });

      resolve({
        filteredCalls,
        filteredProtocol,
        filteredDomain,
        filteredSessiondata,
        filteredAdditionalFlows,
        filteredsummary,
        filteredSchema,
        filteredApi,
      });
    } catch (err) {
      console.log("error", err);
    }
  });
};

export async function generateSession(session_body: any) {
  return new Promise(async (resolve, reject) => {
    const { country, cityCode, transaction_id, configName } = session_body;

    const {
      filteredCalls,
      filteredProtocol,
      filteredDomain,
      filteredSessiondata,
      filteredAdditionalFlows,
      filteredsummary,
      filteredSchema,
      filteredApi,
    } = (await getConfigBasedOnFlow(configName)) as any;

    //add subcriber id from env if found in the env else load from session for igm
    const subscriber_id = process.env.subscriber_id
    const subscriber_url = process.env.subscriber_url
    const subscriber : any = {}
    if(subscriber_id&&subscriber_url){
      subscriber.subscriber_id=subscriber_id
      subscriber.subscriber_url=subscriber_url
    }

    const session = {
      ...session_body,
      bap_id: process.env.SUBSCRIBER_ID,
      bap_uri: process.env.callbackUrl,
      ttl: "PT10M",
      domain: filteredDomain,
      summary: filteredsummary,
      ...filteredSessiondata,
      currentTransactionId: transaction_id,
      transactionIds: [transaction_id],
      // protocol: filteredProtocol,
      calls: filteredCalls,
      additioalFlows: filteredAdditionalFlows,
      // schema: filteredSchema,
      api: filteredApi, 
      ...subscriber // load subscriber id and url from env if exists
    };

    await insertSession(session);
    resolve(true);
  });
}

export const findSession = async (body: any) => {
  try {
    let session = "session";
    const allSessions = await cache.get();

    for (const ses of allSessions) {
      const sessionData = await getSession(ses);
      if (sessionData.transactionIds.includes(body.context.transaction_id)) {
        session = sessionData;
        break;
      }
    }

    return session;
  } catch (error) {
    console.error("Error finding session:", error);
    throw error;
  }
};

module.exports = { generateSession, getSession, insertSession, findSession };
