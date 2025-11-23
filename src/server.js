// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getDaySummary, getOpenDays, getImportStats2025 } from "./storage.js";
import { collectDayFromShopify, collectYear2025FromShopify } from "./shopify.js";
import { sendDayToKlara } from "./klara.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// HEUTE – UI ruft z.B. /api/today auf
app.get("/api/today", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    let summary = getDaySummary(today);

    if (!summary) {
      summary = await collectDayFromShopify(today);
    }

    return res.json({
      date: today,
      umsatz_brutto: summary.umsatzBrutto,
      mwst: summary.mwst,
      gutscheine: summary.gutscheine,
      status: summary.status
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Fehler bei /api/today" });
  }
});

// Offene Tage
app.get("/api/open-days", (req, res) => {
  try {
    const open = getOpenDays();
    return res.json(open);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Fehler bei /api/open-days" });
  }
});

// Tag an Klara senden
app.post("/api/day/:date/send", async (req, res) => {
  const { date } = req.params;
  try {
    const result = await sendDayToKlara(date);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: `Fehler bei /api/day/${date}/send` });
  }
});

// 2025 Import starten (Shopify → Summen pro Tag)
app.post("/api/import/2025/run", async (req, res) => {
  try {
    await collectYear2025FromShopify();
    const stats = getImportStats2025();
    const lastRun = new Date().toISOString();
    return res.json({
      ...stats,
      last_run: lastRun
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Fehler bei /api/import/2025/run" });
  }
});

// 2025 an Klara senden (hier erstmal nur Simulation)
app.post("/api/import/2025/send", async (req, res) => {
  try {
    // Hier könnten wir alle gespeicherten 2025-Tage durchgehen
    // und sendDayToKlara(date) aufrufen.
    // Der Einfachheit halber melden wir erst mal nur OK zurück.
    return res.json({
      ok: true,
      info: "TODO: Alle 2025-Tage einzeln an Klara senden."
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Fehler bei /api/import/2025/send" });
  }
});

app.get("/", (req, res) => {
  res.send("Shopify → Klara Sync Backend läuft.");
});

app.listen(PORT, () => {
  console.log(`Backend läuft auf Port ${PORT}`);
});
