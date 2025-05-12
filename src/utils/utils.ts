const fs = require("fs");

export const formatted_error = (errors: any) => {
  let error_list: any[] = [];
  let status = "";
  errors.forEach((error: any) => {
    if (
      !["not", "oneOf", "anyOf", "allOf", "if", "then", "else"].includes(
        error.keyword
      )
    ) {
      let error_dict = {
        message: `${error.message}${
          error.params.allowedValues ? ` (${error.params.allowedValues})` : ""
        }${error.params.allowedValue ? ` (${error.params.allowedValue})` : ""}${
          error.params.additionalProperty
            ? ` (${error.params.additionalProperty})`
            : ""
        }`,
        details: error.instancePath,
      };
      error_list.push(error_dict);
    }
  });
  if (error_list.length === 0) status = "pass";
  else status = "fail";
  const error_json = { errors: error_list, status: status };
  return error_json;
};

export function parseBoolean(value: string | undefined) {
  // Convert 'true' to true and 'false' to false
  if (value === "true") {
    return true;
  } else if (value === "false") {
    return false;
  }
  // Return null for other values
  return null;
}

export const jsonout = (json: Record<string, any>, filename: string) => {
  console.log("json saved to the file");
  const jsonString = JSON.stringify(json, null, 2);
  fs.writeFile(
    `./compare_temp/${filename}.json`,
    jsonString,
    (err: any, out: any) => {
      if (err) console.log(err);
      else {
        console.log(out);
      }
    }
  );
};

export const buildNackPayload = (msg: string, code = "346001") => {
  const nack = {
    message: {
      ack: {
        status: "NACK",
      },
    },
    error: {
      code: code,
      message: msg,
    },
  };

  return nack;
};
