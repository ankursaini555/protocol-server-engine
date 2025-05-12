import {
  createAuthorizationHeader,
  isSignatureValid,
} from "ondc-crypto-sdk-nodejs";
import { GenericObject } from "ondc-crypto-sdk-nodejs/lib/types";
import axios from "axios";

const LOOKUP_URI = process.env.LOOKUP_URI,
  PRIVATE_KEY = process.env.PRIVATE_KEY,
  BAPID = process.env.SUBSCRIBER_ID,
  UNIQUE_KEY = process.env.SUBSCRIBER_UNIQUE_KEY;

export async function generateHeader(message: GenericObject) {
  if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in the environment variables");
  }
  if (!BAPID) {
    throw new Error("BAPID not found in the environment variables");
  }
  if (!UNIQUE_KEY) {
    throw new Error("UNIQUE_KEY not found in the environment variables");
  }
  
  const result = await createAuthorizationHeader({
    message: message,
    privateKey: PRIVATE_KEY, //SIGNING private key
    bapId: BAPID, // Subscriber ID that you get after registering to ONDC Network
    bapUniqueKeyId: UNIQUE_KEY, // Unique Key Id or uKid that you get after registering to ONDC Network
  });
  return result;
}

const getPublicKey = async (header: any) => {
  try {
    if (!LOOKUP_URI) {
      throw new Error("LOOKUP_URI not found in the environment variables");
    }
    // let LOOKUP_URI = "https://preprod.registry.ondc.org/ondc/lookup";
    const extractSubscriberIdukId = extractSubscriberId(header);
    if (!extractSubscriberIdukId)
      throw new Error("Subscriber ID not found in the header");
    const subscriberId = extractSubscriberIdukId.subscriberID;
    const ukId = extractSubscriberIdukId.uniquePublicKeyID;
    let publicKey: string = "";
    await axios
      .post(LOOKUP_URI, {
        subscriber_id: subscriberId,
        ukId: ukId,
      })
      .then((response: any) => {
        response = response.data;
        publicKey = response[0]?.signing_public_key;
      });

    return publicKey;
  } catch (error) {
    console.trace(error);
  }
};

const extractSubscriberId = (header: any) => {
  // Find the Authorization header
  const authorizationHeader = header.authorization;
  const regex = /keyId="([^"]+)"/;
  const matches = regex.exec(authorizationHeader);

  const keyID = matches ? matches[1] : null;
  if (keyID) {
    // Split the header value using the delimiter '|'
    const parts = keyID.split("|");

    // Check if the parts array has at least two elements
    if (parts.length >= 2) {
      const subscriberID = parts[0];
      const uniquePublicKeyID = parts[1];
      // Return an object with both values
      return { subscriberID, uniquePublicKeyID };
    }
  }
  return null; // Subscriber ID not found
};

export const verifyHeader = async (req: any) => {
  const headers = req.headers;
  if (headers === undefined) {
    return false;
  }
  const public_key = await getPublicKey(headers);
  if (!public_key) {
    console.error(`Public key not found.`);
    return false;
  }
  // const public_key = security.publickey;
  //Validate the request source against the registry
  const isValidSource = await isSignatureValid({
    header: headers?.authorization, // The Authorisation header sent by other network participants
    body: req.body,
    publicKey: public_key,
  });
  if (!isValidSource) {
    return false;
  }
  return true;
};

// module.exports = { generateHeader, verifyHeader };
