// src/klara.js
import axios from "axios";
import { getDaySummary, setDayStatus } from "./storage.js";

const klaraToken = process.env.KLARA_API_TOKEN;

if (!klaraToken) {
  console.warn(
    "[WARN] KLARA_API_TOKEN fehlt. Klara-Buchungen sind noch nicht möglich."
  );
}

/**
 * Buchung für einen Tag an Klara schicken.
 * Verwendet dein Schema:
 *  - 3000 Umsatz 8.1%
 *  - 2200 MWST
 *  - 2030 Gutscheinverbindlichkeiten
 *  - 1101 Forderungen Karten/Online
 */
export async function sendDayToKlara(date) {
  const data = getDaySummary(date);
  if (!data) {
    throw new Error(`Keine Tagesdaten für ${date} gefunden.`);
  }

  const { umsatzBrutto, mwst, gutscheine } = data;

  // TODO: Hier das Format so bauen, wie Klara es erwartet.
  // Im Moment machen wir nur ein Log und markieren als "sent".

  console.log("[Klara] Würde buchen:", {
    date,
    konto3000: umsatzBrutto,
    konto2200: mwst,
    konto2030: gutscheine,
    konto1101: umsatzBrutto // oder ggf. umsatzBrutto + gutscheine
  });

  // Beispiel: Pseudo-Request
  // await axios.post("https://api.klara.ch/.../bookings", payload, {
  //   headers: { Authorization: `Bearer ${klaraToken}` }
  // });

  setDayStatus(date, "sent");
  return { ok: true };
}
