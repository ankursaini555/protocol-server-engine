import { evaluateOperation } from "./utils";

class IOElement {
  context: any;
  operation: any;
  value: any;
  __process() {
    if (this.operation) {
      this.value = evaluateOperation(this.context, this.operation);
    }
    return this;
  }
  getValue() {
    return this.value;
  }
}

export class Input extends IOElement {
  type: string | undefined;
  constructor(context: any, config: any, type: string | undefined = undefined) {
    super();
    this.context = context;
    this.operation = config.operation;
    this.value = config.value;
    this.type = type;
    this.__process();
  }
}

export class Output extends IOElement {
  constructor(value: any) {
    super();
    this.value = value;
  }
  getValue() {
    this.__process;
    return this.value;
  }
}

module.exports = {
  Input,
  Output,
};
