import axios from "axios";

export const checkHealth = async (
  currentService: { name: string; url: string },
  dependencyServices?: { name: string; url: string }[]
) => {
  const response: {
    name: string;
    status: string;
    dependencyServices: { name: string; status: string }[];
    timestamp: string;
    statusCode: number;
  } = {
    name: currentService.name,
    status: "up",
    dependencyServices: [],
    timestamp: new Date().toISOString(),
    statusCode: 200,
  };

  // Check the status of dependency services if provided
  if (dependencyServices && Array.isArray(dependencyServices)) {
    const dependencyChecks = await Promise.allSettled(
      dependencyServices.map(async (service) => {
        try {
          const result = await axios.get(service.url, { timeout: 5000 });
          return {
            name: service.name,
            status: result.status === 200 ? "up" : "down",
          };
        } catch {
          response.statusCode = 299;
          return {
            name: service.name,
            status: "down",
          };
        }
      })
    );

    // Map the results to extract statuses
    response.dependencyServices = dependencyChecks.map((check, index) => {
      if (check.status === "fulfilled") {
        return check.value;
      } else {
        return {
          name: dependencyServices[index].name,
          status: "down",
        };
      }
    });
  }

  return response;
};

export const JsonResponseToText = (json: any) => {
  let text = "";

  // Add the main service name and status
  text += `${json.name
    .replace(/\s+/g, "_")
    .toUpperCase()}=${json.status.toUpperCase()}\n`;

  // Process dependency services
  if (Array.isArray(json.dependencyServices)) {
    json.dependencyServices.forEach((service: any) => {
      text += `${service.name
        .replace(/\s+/g, "_")
        .toUpperCase()}=${service.status.toUpperCase()}\n`;
    });
  }

  // Add the timestamp
  text += `TIME=${json.timestamp}`;

  return text.trim();
};