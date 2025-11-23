// src/storage.js

// In-Memory Speicher: { "2026-01-05": { umsatzBrutto, mwst, gutscheine, status } }
const days = new Map();

/**
 * Speichert oder aktualisiert Tagesdaten.
 */
export function saveDaySummary(date, summary) {
  const existing = days.get(date) || {};
  days.set(date, { ...existing, ...summary });
}

/**
 * Holt Tagesdaten, ansonsten null.
 */
export function getDaySummary(date) {
  return days.get(date) || null;
}

/**
 * Setzt Status für einen Tag (z.B. "prepared", "sent", "error").
 */
export function setDayStatus(date, status) {
  const existing = days.get(date) || {};
  days.set(date, { ...existing, status });
}

/**
 * Liefert alle Tage mit Status != "sent" (offene Tage).
 */
export function getOpenDays() {
  const result = [];
  for (const [date, data] of days.entries()) {
    if (data.status && data.status !== "sent") {
      result.push({ date, status: data.status });
    }
  }
  return result;
}

/**
 * Hilfsfunktion für 2025-Import:
 * alle Tage im Zeitraum mit Umsatz / ohne Umsatz zählen.
 */
export function getImportStats2025() {
  let daysTotal = 0;
  let daysWithRevenue = 0;
  let daysWithoutRevenue = 0;

  for (const [date, data] of days.entries()) {
    if (!date.startsWith("2025-")) continue;
    daysTotal++;
    if (data.umsatzBrutto && data.umsatzBrutto > 0) {
      daysWithRevenue++;
    } else {
      daysWithoutRevenue++;
    }
  }

  return { daysTotal, daysWithRevenue, daysWithoutRevenue };
}
