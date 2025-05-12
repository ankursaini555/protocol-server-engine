import { checkHealth } from "../utils/healthCheck";
import { Request, Response } from "express";

export const healthCheckAPI = async (req: Request, res: Response) => {
  try {
    // Define the current service and its dependencies
    const currentService = {
      name: "Protocol Server Engine",
      url: "http://localhost:7201/health-test", // check current service by session api route
    };

    const dependencyServices = [
      {
        name: "Seller Mock Engine",
        url:
          process.env.BACKEND_SERVER_URL + "/health-test" ||
          "http://localhost:7202/health-test",
      },
      {
        name: "Mock UI",
        url: process.env.MOCK_UI_URL || "http://localhost:3000",
      },
    ];

    const healthStatus = await checkHealth(currentService, dependencyServices);
    res.send(healthStatus);
  } catch (error) {
    console.error("Error in healthCheckAPI:", error);
    res.status(500).send({
      message: "An error occurred while processing the health check.",
      error: error || error,
    });
  }
};
