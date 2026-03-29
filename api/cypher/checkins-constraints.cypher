// ── CheckIn Feature Constraints & Indexes ──
// Run once against the production database before deploying the check-in feature.
// All statements use IF NOT EXISTS and are safe to re-run.

// ── CheckInEvent ──
CREATE CONSTRAINT uniqueCheckInEvent IF NOT EXISTS
  ON (e:CheckInEvent) ASSERT e.id IS UNIQUE;

CREATE INDEX checkInEventStatus IF NOT EXISTS
  FOR (e:CheckInEvent) ON (e.status);

CREATE INDEX checkInEventScope IF NOT EXISTS
  FOR (e:CheckInEvent) ON (e.scopeId, e.scopeLevel);

// ── CheckInRecord ──
CREATE CONSTRAINT uniqueCheckInRecord IF NOT EXISTS
  ON (r:CheckInRecord) ASSERT r.id IS UNIQUE;

CREATE INDEX checkInRecordEventId IF NOT EXISTS
  FOR (r:CheckInRecord) ON (r.eventId);

CREATE INDEX checkInRecordMember IF NOT EXISTS
  FOR (r:CheckInRecord) ON (r.eventId, r.memberId);

// ── CheckInDevice (one-device-per-event enforcement) ──
CREATE CONSTRAINT uniqueCheckInDevice IF NOT EXISTS
  ON (d:CheckInDevice) ASSERT d.id IS UNIQUE;

// ── CheckInAttempt (PIN rate-limiting) ──
CREATE CONSTRAINT uniqueCheckInAttempt IF NOT EXISTS
  ON (a:CheckInAttempt) ASSERT a.id IS UNIQUE;

// ── CheckInHistory (audit log) ──
CREATE CONSTRAINT uniqueCheckInHistory IF NOT EXISTS
  ON (h:CheckInHistory) ASSERT h.id IS UNIQUE;

CREATE INDEX checkInHistoryEventId IF NOT EXISTS
  FOR (h:CheckInHistory) ON (h.eventId);
