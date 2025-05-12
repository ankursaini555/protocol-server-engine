import { evaluateOperation } from "./utils";

export const dynamicReponse = (
  req_body: Record<string, any>,
  callback: any
) => {
  const context = {
    req_body: req_body,
  };

  if (Object.keys(callback).length > 1) {
    for (const payloads in callback) {
      if (payloads != "default") {
        const result = evaluateOperation(
          context,
          callback[payloads].condition?.operation
        );
        if (result) {
          return {
            callback: callback[payloads].callback,
            serviceUrl: callback[payloads].service_url,
            sync: callback[payloads].sync,
          };
        }
      }
    }
  }
  return {
    callback: callback["default"].callback,
    serviceUrl: callback["default"].service_url,
    sync: callback["default"].sync,
  };
};

export const dynamicFlow = (req_body: Record<string, any>, callback: any) => {
  const context = {
    req_body: req_body,
  };

  if (Object.keys(callback).length > 1) {
    for (const payloads in callback) {
      if (payloads != "default") {
        const result = evaluateOperation(
          context,
          callback[payloads].condition?.operation
        );
        if (result) {
          return callback[payloads].config_id;
        }
      }
    }
  }
  return callback["default"].config_id;
};
module.exports = { dynamicReponse, dynamicFlow };
