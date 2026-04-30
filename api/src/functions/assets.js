import { app } from "@azure/functions";

const baseAssets = [
  {
    id: "PMP-A12",
    name: "Pump A-12",
    zone: "Plant A · Utility Area",
    risk: 88,
    health: 38,
    temperature: 90,
    vibration: 80,
    pressure: 74,
    position: { x: "24%", y: "34%" },
    recommendation: "Inspect bearing housing and corrosion area before next production shift."
  },
  {
    id: "PIPE-B07",
    name: "Pipeline B-07",
    zone: "Energy Line · Zone B",
    risk: 70,
    health: 58,
    temperature: 74,
    vibration: 45,
    pressure: 83,
    position: { x: "70%", y: "42%" },
    recommendation: "Check pressure consistency and run thermal validation within 48 hours."
  },
  {
    id: "TNK-D04",
    name: "Tank D-04",
    zone: "Storage · Zone C",
    risk: 40,
    health: 82,
    temperature: 60,
    vibration: 20,
    pressure: 64,
    position: { x: "42%", y: "72%" },
    recommendation: "Continue routine monitoring and scheduled inspection cycle."
  },
  {
    id: "MTR-C21",
    name: "Motor C-21",
    zone: "Production Line 3",
    risk: 35,
    health: 86,
    temperature: 55,
    vibration: 25,
    pressure: 47,
    position: { x: "18%", y: "70%" },
    recommendation: "No immediate action. Keep scheduled inspection cycle."
  }
];

function statusFromRisk(risk) {
  if (risk > 82) return "Critical";
  if (risk > 60) return "Warning";
  return "Normal";
}

function randomDelta(range = 6) {
  return Math.floor(Math.random() * range - range / 2);
}

app.http("assets", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "assets",
  handler: async () => {
    const assets = baseAssets.map((asset) => {
      const risk = Math.min(100, Math.max(0, asset.risk + randomDelta(8)));
      return {
        ...asset,
        risk,
        health: Math.max(0, Math.min(100, 100 - risk + randomDelta(5))),
        temperature: Math.max(20, asset.temperature + randomDelta(6)),
        vibration: Math.max(5, asset.vibration + randomDelta(8)),
        pressure: Math.max(20, asset.pressure + randomDelta(6)),
        status: statusFromRisk(risk)
      };
    });

    return {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      jsonBody: {
        source: "Azure Functions",
        updatedAt: new Date().toISOString(),
        assets
      }
    };
  }
});
