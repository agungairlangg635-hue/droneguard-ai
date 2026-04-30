import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_ASSETS_URL = "/api/assets";
const API_TELEMETRY_URL = "/api/telemetry";

const initialAssets = [
  {
    id: "PMP-A12",
    name: "Pump A-12",
    zone: "Plant A · Utility Area",
    status: "Critical",
    risk: 88,
    health: 38,
    temperature: 90,
    vibration: 80,
    pressure: 74,
    position: { x: "24%", y: "34%" },
    recommendation: "Inspect bearing housing and corrosion area before next production shift.",
  },
  {
    id: "PIPE-B07",
    name: "Pipeline B-07",
    zone: "Energy Line · Zone B",
    status: "Warning",
    risk: 70,
    health: 58,
    temperature: 74,
    vibration: 45,
    pressure: 83,
    position: { x: "70%", y: "42%" },
    recommendation: "Check pressure consistency and run thermal validation within 48 hours.",
  },
  {
    id: "TNK-D04",
    name: "Tank D-04",
    zone: "Storage · Zone C",
    status: "Normal",
    risk: 40,
    health: 82,
    temperature: 60,
    vibration: 20,
    pressure: 64,
    position: { x: "42%", y: "72%" },
    recommendation: "Continue routine monitoring and scheduled inspection cycle.",
  },
  {
    id: "MTR-C21",
    name: "Motor C-21",
    zone: "Production Line 3",
    status: "Normal",
    risk: 35,
    health: 86,
    temperature: 55,
    vibration: 25,
    pressure: 47,
    position: { x: "18%", y: "70%" },
    recommendation: "No immediate action. Keep scheduled inspection cycle.",
  },
];

const initialDrone = {
  id: "LITEWING-01",
  mode: "Simulation",
  battery: 78,
  altitude: 32,
  speed: 12,
  signal: 96,
  route: 64,
};

function statusClass(status) {
  if (status === "Critical") return "bg-red-500/15 text-red-300 border-red-400/30";
  if (status === "Warning") return "bg-yellow-400/15 text-yellow-200 border-yellow-300/30";
  return "bg-emerald-400/15 text-emerald-300 border-emerald-400/30";
}

function riskColor(status) {
  if (status === "Critical") return "bg-red-400";
  if (status === "Warning") return "bg-yellow-300";
  return "bg-emerald-300";
}

function randomDelta(range = 6) {
  return Math.floor(Math.random() * range - range / 2);
}

function updateAsset(asset) {
  const risk = Math.min(100, Math.max(0, asset.risk + randomDelta(7)));
  return {
    ...asset,
    risk,
    health: Math.max(0, Math.min(100, 100 - risk + randomDelta(5))),
    temperature: Math.max(20, asset.temperature + randomDelta(5)),
    vibration: Math.max(5, asset.vibration + randomDelta(7)),
    pressure: Math.max(20, asset.pressure + randomDelta(5)),
    status: risk > 82 ? "Critical" : risk > 60 ? "Warning" : "Normal",
  };
}

function updateDrone(drone) {
  return {
    ...drone,
    battery: Math.max(10, drone.battery - Math.random() * 0.6),
    altitude: Math.max(15, Math.round(drone.altitude + randomDelta(3))),
    speed: Math.max(0, Math.round(drone.speed + randomDelta(3))),
    signal: Math.max(70, Math.min(100, Math.round(drone.signal + randomDelta(4)))),
    route: Math.min(100, Math.round(drone.route + 2)),
  };
}

function normalizeAssets(payload) {
  const raw = Array.isArray(payload) ? payload : payload?.assets;
  if (!Array.isArray(raw) || raw.length === 0) return initialAssets;

  return raw.map((asset, index) => ({
    ...initialAssets[index % initialAssets.length],
    ...asset,
    risk: Number(asset.risk ?? initialAssets[index % initialAssets.length].risk),
    health: Number(asset.health ?? initialAssets[index % initialAssets.length].health),
    temperature: Number(asset.temperature ?? asset.temp ?? initialAssets[index % initialAssets.length].temperature),
    vibration: Number(asset.vibration ?? initialAssets[index % initialAssets.length].vibration),
    pressure: Number(asset.pressure ?? initialAssets[index % initialAssets.length].pressure),
    position: asset.position ?? initialAssets[index % initialAssets.length].position,
  }));
}

function normalizeTelemetry(payload) {
  const raw = payload?.drone ?? payload;
  if (!raw || typeof raw !== "object") return initialDrone;

  return {
    ...initialDrone,
    ...raw,
    battery: Number(raw.battery ?? initialDrone.battery),
    altitude: Number(raw.altitude ?? initialDrone.altitude),
    speed: Number(raw.speed ?? initialDrone.speed),
    signal: Number(raw.signal ?? initialDrone.signal),
    route: Number(raw.route ?? initialDrone.route),
    mode: raw.mode ?? "Azure Telemetry",
  };
}

export default function App() {
  const [assets, setAssets] = useState(initialAssets);
  const [selected, setSelected] = useState(initialAssets[0]);
  const [drone, setDrone] = useState(initialDrone);
  const [logs, setLogs] = useState(["System initialized in simulation mode"]);
  const [history, setHistory] = useState([
    { time: "T-5", risk: 78, temp: 82, vibration: 70 },
    { time: "T-4", risk: 80, temp: 84, vibration: 73 },
    { time: "T-3", risk: 83, temp: 86, vibration: 75 },
    { time: "T-2", risk: 85, temp: 88, vibration: 78 },
    { time: "Now", risk: 88, temp: 90, vibration: 80 },
  ]);
  const [aiRunning, setAiRunning] = useState(false);
  const [connectionMode, setConnectionMode] = useState("Simulation Mode");
  const [lastSync, setLastSync] = useState("Not connected");
  const [cloudReady, setCloudReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!cloudReady) {
        setAssets((previous) => previous.map(updateAsset));
        setDrone((previous) => updateDrone(previous));
        setLogs((previous) => ["Simulation telemetry packet received", ...previous.slice(0, 7)]);
      }

      setHistory((previous) => [
        ...previous.slice(-9),
        {
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          risk: selected.risk,
          temp: selected.temperature,
          vibration: selected.vibration,
        },
      ]);
    }, 3000);

    return () => clearInterval(timer);
  }, [selected, cloudReady]);

  const averageRisk = useMemo(() => {
    return Math.round(assets.reduce((sum, item) => sum + item.risk, 0) / assets.length);
  }, [assets]);

  const criticalCount = useMemo(() => {
    return assets.filter((asset) => asset.status === "Critical").length;
  }, [assets]);

  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => b.risk - a.risk);
  }, [assets]);

  function selectAsset(asset) {
    setSelected(asset);
    setHistory([
      { time: "T-5", risk: Math.max(0, asset.risk - 12), temp: asset.temperature - 6, vibration: asset.vibration - 8 },
      { time: "T-4", risk: Math.max(0, asset.risk - 9), temp: asset.temperature - 4, vibration: asset.vibration - 5 },
      { time: "T-3", risk: Math.max(0, asset.risk - 6), temp: asset.temperature - 3, vibration: asset.vibration - 4 },
      { time: "T-2", risk: Math.max(0, asset.risk - 3), temp: asset.temperature - 1, vibration: asset.vibration - 2 },
      { time: "Now", risk: asset.risk, temp: asset.temperature, vibration: asset.vibration },
    ]);
    setLogs((previous) => [`Selected asset ${asset.id}`, ...previous.slice(0, 7)]);
  }

  function runAI() {
    setAiRunning(true);
    setLogs((previous) => [`AI vision analysis started for ${selected.id}`, ...previous.slice(0, 7)]);
    setTimeout(() => {
      setAiRunning(false);
      setLogs((previous) => [`AI finding: anomaly probability ${selected.risk > 75 ? "94" : "61"}% on ${selected.id}`, ...previous.slice(0, 7)]);
    }, 1200);
  }

  function scheduleFix() {
    setLogs((previous) => [`Work order created for ${selected.id}`, ...previous.slice(0, 7)]);
  }

  async function syncAzure() {
    setConnectionMode("Connecting to Azure...");
    setLogs((previous) => ["Connecting to /api/assets and /api/telemetry", ...previous.slice(0, 7)]);

    try {
      const [assetsResponse, telemetryResponse] = await Promise.all([
        fetch(API_ASSETS_URL),
        fetch(API_TELEMETRY_URL),
      ]);

      if (!assetsResponse.ok || !telemetryResponse.ok) {
        throw new Error("Azure Functions endpoint not available yet");
      }

      const assetsPayload = await assetsResponse.json();
      const telemetryPayload = await telemetryResponse.json();
      const nextAssets = normalizeAssets(assetsPayload);
      const nextDrone = normalizeTelemetry(telemetryPayload);

      setAssets(nextAssets);
      setDrone(nextDrone);
      setSelected(nextAssets.find((asset) => asset.id === selected.id) ?? nextAssets[0]);
      setCloudReady(true);
      setConnectionMode("Azure Functions Connected");
      setLastSync(new Date().toLocaleTimeString());
      setLogs((previous) => ["Azure sync success: live API data loaded", ...previous.slice(0, 7)]);
    } catch (error) {
      setCloudReady(false);
      setConnectionMode("Simulation Mode");
      setLastSync("Azure API unavailable");
      setLogs((previous) => ["Azure API unavailable — simulation fallback active", ...previous.slice(0, 7)]);
    }
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-white/10 bg-[#0b1628] p-6 xl:block">
          <div className="mb-10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 font-black text-slate-950">DG</div>
            <h1 className="text-2xl font-black tracking-tight">DroneGuard AI</h1>
            <p className="mt-1 text-sm text-slate-400">Industrial drone command center</p>
          </div>

          <nav className="space-y-2 text-sm font-semibold">
            <div className="rounded-2xl bg-cyan-300 px-4 py-3 text-slate-950">Mission Control</div>
            <div className="rounded-2xl px-4 py-3 text-slate-400">Assets</div>
            <div className="rounded-2xl px-4 py-3 text-slate-400">AI Inspection</div>
            <div className="rounded-2xl px-4 py-3 text-slate-400">Maintenance</div>
            <div className="rounded-2xl px-4 py-3 text-slate-400">Azure Integration</div>
          </nav>

          <div className="mt-10 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
            <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-200">Connection</p>
            <p className="mt-2 font-black text-cyan-50">{connectionMode}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">ESP32 drone → Azure Functions → Dashboard</p>
            <p className="mt-2 text-xs text-slate-500">Last sync: {lastSync}</p>
          </div>
        </aside>

        <section className="flex-1 p-5 lg:p-8">
          <header className="mb-6 flex flex-col justify-between gap-4 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-black/20 backdrop-blur lg:flex-row lg:items-center">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[.2em] text-cyan-300">Prototype for Manufacturing & Energy</p>
              <h2 className="text-3xl font-black tracking-tight lg:text-4xl">Drone-Based Asset Monitoring Dashboard</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">A professional command center prepared for real drone telemetry, AI anomaly detection, and Azure cloud integration.</p>
              <div className="mt-3 inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-slate-300">
                Source: {cloudReady ? "Azure Functions API" : "Simulation fallback"}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-[430px]">
              <KPI label="Avg Risk" value={`${averageRisk}%`} />
              <KPI label="Critical" value={criticalCount} />
              <KPI label="Drone" value={`${Math.round(drone.battery)}%`} />
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/20">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black">Drone Mission Map</h3>
                  <p className="mt-1 text-sm text-slate-400">Click asset points to inspect condition.</p>
                </div>
                <button onClick={syncAzure} className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-300/20">
                  {cloudReady ? "Azure Connected" : "Connect Azure API"}
                </button>
              </div>

              <div className="relative h-[470px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#020817]">
                <div className="absolute inset-0 opacity-[0.10] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:44px_44px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.18),transparent_36%)]" />

                <div className="absolute left-[20%] top-[32%] h-[2px] w-[52%] rotate-[8deg] bg-cyan-300/30" />
                <div className="absolute left-[42%] top-[69%] h-[2px] w-[30%] -rotate-[35deg] bg-cyan-300/30" />

                <div className="absolute left-[50%] top-[48%] grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl border border-cyan-300/30 bg-cyan-300/10 shadow-[0_0_50px_rgba(34,211,238,.35)]">
                  <div className="h-8 w-8 rounded-full bg-cyan-300 shadow-[0_0_40px_rgba(34,211,238,.6)]" />
                </div>

                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => selectAsset(asset)}
                    className="group absolute -translate-x-1/2 -translate-y-1/2 text-left transition hover:scale-110"
                    style={{ left: asset.position.x, top: asset.position.y }}
                  >
                    <span className={`mb-2 block h-5 w-5 rounded-full shadow-lg ${riskColor(asset.status)} ${selected.id === asset.id ? "ring-4 ring-white/70" : ""}`} />
                    <span className={`block rounded-xl border px-3 py-2 text-xs font-black ${statusClass(asset.status)} ${selected.id === asset.id ? "border-white/50 bg-white/10 text-white" : ""}`}>{asset.id}</span>
                  </button>
                ))}

                <div className="absolute bottom-5 left-5 right-5 grid gap-3 md:grid-cols-5">
                  <Telemetry label="Drone ID" value={drone.id} />
                  <Telemetry label="Battery" value={`${Math.round(drone.battery)}%`} />
                  <Telemetry label="Altitude" value={`${drone.altitude}m`} />
                  <Telemetry label="Speed" value={`${drone.speed}m/s`} />
                  <Telemetry label="Signal" value={`${drone.signal}%`} />
                </div>
              </div>
            </section>

            <section className="grid gap-6">
              <Panel title="Selected Asset">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">{selected.id}</p>
                    <h3 className="mt-1 text-2xl font-black">{selected.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{selected.zone}</p>
                  </div>
                  <span className={`rounded-xl border px-3 py-1 text-xs font-black ${statusClass(selected.status)}`}>{selected.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Metric label="Risk" value={`${selected.risk}%`} />
                  <Metric label="Health" value={`${selected.health}%`} />
                  <Metric label="Temp" value={`${selected.temperature}°C`} />
                  <Metric label="Vibration" value={`${selected.vibration}%`} />
                </div>

                <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-50">
                  {selected.recommendation}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button onClick={runAI} className="rounded-xl bg-cyan-300 px-4 py-3 font-black text-slate-950 hover:bg-cyan-200">{aiRunning ? "Analyzing..." : "Run AI"}</button>
                  <button onClick={scheduleFix} className="rounded-xl bg-emerald-300 px-4 py-3 font-black text-slate-950 hover:bg-emerald-200">Create Work Order</button>
                </div>
              </Panel>

              <Panel title="Priority Queue">
                <div className="space-y-3">
                  {sortedAssets.map((asset) => (
                    <button key={asset.id} onClick={() => selectAsset(asset)} className={`w-full rounded-2xl border p-3 text-left transition hover:bg-white/10 ${selected.id === asset.id ? "border-cyan-300/60 bg-cyan-300/10" : "border-white/10 bg-black/20"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold">{asset.name}</p>
                          <p className="text-xs text-slate-500">Risk {asset.risk}%</p>
                        </div>
                        <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${statusClass(asset.status)}`}>{asset.status}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${asset.risk}%` }} /></div>
                    </button>
                  ))}
                </div>
              </Panel>
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
            <Panel title="Sensor Trend">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.16)" />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: "#020817", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12 }} />
                    <Area type="monotone" dataKey="risk" stroke="#22d3ee" fill="#22d3ee22" strokeWidth={3} />
                    <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="vibration" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="System Activity">
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div key={`${log}-${index}`} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-emerald-300">{log}</div>
                ))}
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function KPI({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-xl shadow-black/20">
      <h3 className="mb-4 text-xl font-black">{title}</h3>
      {children}
    </section>
  );
}

function Telemetry({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur">
      <p className="text-[10px] uppercase tracking-[.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
