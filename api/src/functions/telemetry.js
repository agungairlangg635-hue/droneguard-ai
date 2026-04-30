import { app } from "@azure/functions";

function randomDelta(range = 6) {
  return Math.floor(Math.random() * range - range / 2);
}

app.http("telemetry", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "telemetry",
  handler: async () => {
    const drone = {
      id: "LITEWING-01",
      mode: "Azure Telemetry",
      battery: Math.max(10, Math.round(78 + randomDelta(6))),
      altitude: Math.max(15, Math.round(32 + randomDelta(4))),
      speed: Math.max(0, Math.round(12 + randomDelta(4))),
      signal: Math.max(70, Math.min(100, Math.round(96 + randomDelta(5)))),
      route: Math.min(100, Math.max(0, Math.round(64 + randomDelta(8))))
    };

    return {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      jsonBody: {
        source: "Azure Functions",
        updatedAt: new Date().toISOString(),
        drone
      }
    };
  }
});
