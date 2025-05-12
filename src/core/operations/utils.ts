import {
  GenerateUuidOperation,
  ReadOperation,
  GenerateTmpstmpOperation,
  EqualOperation,
  AndOrOperation,
  equalReturn,
  stringifybase64,
} from "./operations";
import { Input } from "./schema";

export function evaluateOperation(context: any, op: any) {
  var opt = __getOperation(context, op.type);
  if (!opt) {
    throw new Error("Invalid operation type");
  }
  if (op["input"]) {
    opt.input = __evaluateInput(context, op["input"], op.type);
  }
  return opt.getOutput().getValue();
}

function __evaluateInput(context: any, inputObj: any, type: string) {
  var input = new Input(context, inputObj, type);
  return input;
}

function __getOperation(context: any, op: any) {
  switch (op) {
    case "GENERATE_UUID":
      return new GenerateUuidOperation(context);
    case "READ":
      return new ReadOperation(context);
    case "GENERATE_TIMESTAMP":
      return new GenerateTmpstmpOperation(context);
    case "EQUAL":
      return new EqualOperation(context);
    case "AND":
    case "OR":
      return new AndOrOperation(context);
    case "EQUALRETURN":
      return new equalReturn(context);
    case "STRINGIFY":
      return new stringifybase64(context);
  }
}

// module.exports = { evaluateOperation };
