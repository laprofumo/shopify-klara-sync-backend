// src/shopify.js
import axios from "axios";
import { saveDaySummary } from "./storage.js";

const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
const adminToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const apiVersion = "2024-10";

if (!storeDomain || !adminToken) {
  console.warn(
    "[WARN] Shopify-Konfiguration fehlt. Bitte SHOPIFY_STORE_DOMAIN und SHOPIFY_ADMIN_API_ACCESS_TOKEN setzen."
  );
}

const client = axios.create({
  baseURL: `https://${storeDomain}/admin/api/${apiVersion}`,
  headers: {
    "X-Shopify-Access-Token": adminToken,
    "Content-Type": "application/json"
  }
});

/**
 * auf 2 Nachkommastellen runden
 */
function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * MWST 8.1% aus Bruttobetrag berechnen.
 * Brutto = Netto * 1.081
 * MWST = Brutto - Netto
 */
function calcMwst81(umsatzBrutto) {
  if (!umsatzBrutto || umsatzBrutto <= 0) return 0;
  const netto = umsatzBrutto / 1.081;
  return round2(umsatzBrutto - netto);
}

/**
 * Bestellungen für ein Datum (YYYY-MM-DD) aus Shopify holen.
 * - nur bezahlte Bestellungen (financial_status=paid)
 * - stornierte Bestellungen ignorieren
 * - Giftcard-Verkäufe getrennt erfassen
 */
async function fetchOrdersForDate(date) {
  if (!storeDomain || !adminToken) {
    throw new Error(
      "Shopify-Zugangsdaten fehlen (STORE_DOMAIN oder TOKEN nicht gesetzt)."
    );
  }

  // Zeitraum des Tages in UTC (ungefähr, für viele Shops ausreichend)
  const created_at_min = `${date}T00:00:00Z`;
  const created_at_max = `${date}T23:59:59Z`;

  const params = {
    status: "any",
    financial_status: "paid",
    created_at_min,
    created_at_max,
    limit: 250
  };

  const orders = [];

  try {
    const res = await client.get("/orders.json", { params });
    if (res.data && Array.isArray(res.data.orders)) {
      orders.push(...res.data.orders);
    }
    // TODO: Falls du mehr als 250 Bestellungen pro Tag hast,
    // müsste hier die Paginierung per page_info ergänzt werden.
  } catch (err) {
    console.error("[Shopify] Fehler beim Laden der Bestellungen:", err.message);
    throw err;
  }

  return orders;
}

/**
 * Echte Tageszahlen aus Shopify holen und speichern.
 */
export async function collectDayFromShopify(date) {
  // 1. Bestellungen laden
  const orders = await fetchOrdersForDate(date);

  let totalUmsatzBrutto = 0;
  let totalGutscheine = 0;

  for (const order of orders) {
    // Stornierte Bestellungen ignorieren
    if (order.cancelled_at) continue;

    // Zeilen durchgehen
    if (!Array.isArray(order.line_items)) continue;

    for (const line of order.line_items) {
      const qty = line.quantity ?? 1;
      // price = Einzelpreis; line_price = Gesamtbetrag der Zeile
      const linePrice =
        line.line_price != null
          ? parseFloat(line.line_price)
          : parseFloat(line.price) * qty;

      if (isNaN(linePrice)) continue;

      // Gift Cards getrennt erfassen
      if (line.gift_card) {
        totalGutscheine += linePrice;
      } else {
        totalUmsatzBrutto += linePrice;
      }
    }
  }

  totalUmsatzBrutto = round2(totalUmsatzBrutto);
  totalGutscheine = round2(totalGutscheine);
  const mwst = calcMwst81(totalUmsatzBrutto);

  const summary = {
    umsatzBrutto: totalUmsatzBrutto,
    mwst,
    gutscheine: totalGutscheine,
    status: "prepared"
  };

  console.log("[Shopify] Tageszusammenfassung", date, summary);

  saveDaySummary(date, summary);

  return summary;
}

/**
 * Rückwirkender Import 2025:
 * Ruft intern collectDayFromShopify() pro Tag auf.
 * (je nach Shop-Größe kann das dauern – für den Start ok)
 */
export async function collectYear2025FromShopify() {
  const year = 2025;

  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 31; day++) {
      const mm = String(month).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      const date = `${year}-${mm}-${dd}`;

      try {
        await collectDayFromShopify(date);
      } catch (err) {
        console.error("[Shopify] Fehler beim Import für Tag", date, err.message);
      }
    }
  }
}
