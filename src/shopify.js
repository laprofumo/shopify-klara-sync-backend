// src/shopify.js
import axios from "axios";
import { saveDaySummary } from "./storage.js";

const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
const adminToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

if (!storeDomain || !adminToken) {
  console.warn(
    "[WARN] Shopify-Konfiguration fehlt. Bitte SHOPIFY_STORE_DOMAIN und SHOPIFY_ADMIN_API_ACCESS_TOKEN setzen."
  );
}

/**
 * Hilfsfunktion: MWST 8.1% aus Brutto berechnen.
 */
function calcMwst81(umsatzBrutto) {
  if (!umsatzBrutto || umsatzBrutto <= 0) return 0;
  const netto = umsatzBrutto / 1.081;
  return +(umsatzBrutto - netto).toFixed(2);
}

/**
 * TODO: echte Shopify-Abfrage.
 * Derzeit: Demo-Logik mit Fake-Werten, damit deine UI schon funktioniert.
 */
export async function collectDayFromShopify(date) {
  // Später hier:
  // 1. Bestellungen vom Tag aus Shopify holen
  // 2. bezahlte Orders filtern
  // 3. Gutscheine (Gift Cards) Verkäufe erkennen
  // 4. Einlösungen ignorieren
  // 5. Summen bilden

  // --- DEMO-WERTE (nur zum Testen) ---
  const demoUmsatz = 780.0;
  const demoGutscheine = 200.0;
  const demoMwst = calcMwst81(demoUmsatz);

  const summary = {
    umsatzBrutto: demoUmsatz,
    mwst: demoMwst,
    gutscheine: demoGutscheine,
    status: "prepared"
  };

  saveDaySummary(date, summary);

  return summary;
}

/**
 * TODO: Rückwirkender Import 2025.
 * Hier später: alle Bestellungen 2025 durchgehen und pro Tag Summen speichern.
 */
export async function collectYear2025FromShopify() {
  // DEMO: wir simulieren, dass alle 365 Tage eingelesen wurden
  // und 241 Tage Umsatz hatten, der Rest nicht.
  const year = 2025;

  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 31; day++) {
      const mm = String(month).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const date = `${year}-${mm}-${dd}`;

      // ganz grob: jeden zweiten Tag Demo-Umsatz
      const hasRevenue = (month + day) % 2 === 0;

      if (hasRevenue) {
        const umsatzBrutto = 500;
        const mwst = calcMwst81(umsatzBrutto);
        saveDaySummary(date, {
          umsatzBrutto,
          mwst,
          gutscheine: 100,
          status: "prepared"
        });
      } else {
        saveDaySummary(date, {
          umsatzBrutto: 0,
          mwst: 0,
          gutscheine: 0,
          status: "prepared"
        });
      }
    }
  }
}
