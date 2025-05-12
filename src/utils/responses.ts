export const ack = {
  message: {
    ack: {
      status: "ACK",
    },
  },
};

export const schemaNack = {
  message: {
    ack: {
      status: "NACK",
    },
  },
  error: {
    code: "346001",
    path: "string",
    message: "Schema validation error",
  },
};
export const invalidNack = {
  message: {
    ack: {
      status: "NACK",
    },
  },
  error: {
    code: "10000",
    path: "string",
    message: "Generic bad or invalid request error",
  },
};
export const signNack = {
  message: {
    ack: {
      status: "NACK",
    },
  },
  error: {
    code: "20001",
    path: "string",
    message: "Cannot verify signature for request",
  },
};

export const sessionNack = {
  message: {
    ack: {
      status: "NACK",
    },
  },
  error: {
    message: "Session does not exist",
  },
};

export const sessionAck = {
  message: {
    ack: {
      status: "ACK",
      message: "Session Generated",
    },
  },
};

export const errorNack = {
  message: {
    ack: {
      status: "NACK",
    },
  },
  error: {
    message: "Internal Server Error",
  },
};

// module.exports = {
//   ack,
//   schemaNack,
//   signNack,
//   invalidNack,
//   sessionNack,
//   sessionAck,
//   errorNack,
// };
