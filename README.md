# DroneGuard AI

DroneGuard AI adalah prototype web dashboard untuk challenge Dicoding AI Impact: integrasi drone, IoT telemetry, AI anomaly detection, dan Azure cloud untuk monitoring aset industri manufaktur/energi.

## Fitur

- Drone Mission Map: titik aset industri yang bisa diklik.
- Drone Telemetry: battery, altitude, speed, signal.
- Asset Risk Scoring: risk, health, temperature, vibration.
- AI Action Simulation: tombol Run AI untuk simulasi deteksi anomali.
- Work Order Simulation: tombol Create Work Order.
- Azure Functions API:
  - `GET /api/assets`
  - `GET /api/telemetry`
- Fallback simulation jika API belum aktif.

## Struktur Project

```txt
droneguard-ai/
├─ api/
│  ├─ host.json
│  ├─ package.json
│  └─ src/functions/
│     ├─ assets.js
│     └─ telemetry.js
├─ src/
│  ├─ App.jsx
│  ├─ index.css
│  └─ main.jsx
├─ index.html
├─ package.json
├─ staticwebapp.config.json
├─ tailwind.config.js
├─ postcss.config.js
└─ vite.config.js
```

## Jalankan Local Frontend

```bash
npm install
npm run dev
```

Buka:

```txt
http://localhost:5173
```

## Jalankan Azure Functions Local

Install Azure Functions Core Tools dulu jika belum ada.

```bash
cd api
npm install
npx func start
```

Cek endpoint:

```txt
http://localhost:7071/api/assets
http://localhost:7071/api/telemetry
```

Frontend Vite sudah punya proxy `/api` ke `http://localhost:7071`, jadi tombol **Connect Azure API** akan bekerja ketika Functions local aktif.

## Deploy ke Azure Static Web Apps

1. Push project ini ke GitHub.
2. Buka Azure Portal.
3. Create Resource → Static Web Apps.
4. Hubungkan ke repository GitHub.
5. Build settings:

```txt
App location: /
Api location: api
Output location: dist
Build command: npm run build
```

6. Setelah deploy selesai, buka URL Azure Static Web Apps.
7. Klik **Connect Azure API** di dashboard.

## Flow Sistem

```txt
ESP32 Drone / Sensor
        ↓
Azure Functions (/api/assets, /api/telemetry)
        ↓
React Dashboard on Azure Static Web Apps
        ↓
AI Risk Insight + Maintenance Decision
```

## Catatan Prototype

Saat drone fisik belum tersedia, dashboard berjalan dengan simulasi. Ketika drone ESP32 sudah mengirim data, endpoint Azure Functions bisa diganti untuk membaca data real dari IoT Hub, database, atau HTTP telemetry.
