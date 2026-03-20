# Digital Check-In System — Executive Summary

*For Church Leadership*

---

## What Is This?

The FL Admin Portal now includes a **digital check-in system** that allows church leadership to track which leaders are present at events — automatically, accurately, and without the need for physical registers or manual counting.

It works on any smartphone or tablet. Leaders check in with a tap. Admins see attendance in real time.

---

## Why We Built This

Tracking leader attendance has always been a challenge. Manual counts take time. There is no way to know in real time who has or hasn't shown up.

This system solves all of that. It gives leadership:

- **A live headcount** — updated the moment each leader checks in
- **A permanent record** — every event's attendance is stored and exportable
- **Fraud prevention** — the system makes it very difficult for someone to check in on behalf of another person
- **Zero paperwork** — the entire process happens on phones

---

## How It Works — Step by Step

### Step 1 — An Admin Creates the Event

Before the meeting, an admin (Campus, Stream, or Council level) opens the app and creates a check-in event. They set:

- The name and time of the meeting
- Which leaders are expected (e.g. all Bacenta leaders under a Stream)
- The **location boundary** — a virtual fence drawn on a map around the venue

Once saved, the system automatically knows who should be there and is ready to receive check-ins.

---

### Step 2 — Leaders Check In at the Venue

When leaders arrive at the venue, they open the app and check in. There are three ways to do this:

**Option A — QR Code Scan**
A QR code is displayed on any phone or screen at the venue. The leader scans it with their phone and they are checked in instantly. The QR code refreshes every 60 seconds so it cannot be screenshotted and used later or from another location.

**Option B — PIN Code**
The admin shares a 6-digit PIN for the event. The leader types it in to check in. The PIN can be changed by the admin at any time if needed.

**Option C — Face Recognition**
The leader takes a selfie using their front-facing camera. The app verifies their face and checks them in. If the match is uncertain, the check-in is flagged for the admin to review.

---

### Step 3 — The Location Boundary Is Always Enforced

Regardless of which method a leader uses, **they must be physically present at the venue to check in**. The app uses the phone's GPS to confirm their location against the virtual fence the admin drew around the venue.

- If they are inside the fence → check-in proceeds
- If they are outside the fence → check-in is blocked, even with the correct QR or PIN

This means **a leader cannot check in from home, from a car park far away, or from anywhere other than the actual venue**. This applies equally to leaders, admins, and manual check-ins done by admins on behalf of others.

---

### Step 4 — Admin Watches Attendance in Real Time

The admin opens the **dashboard** and sees:

- A live count of who has checked in, who hasn't, and who has left
- A percentage showing overall attendance
- The ability to filter by sub-group (e.g. by Stream within a Campus event)
- A list of each leader's name, their role, and when they checked in

If a leader has a genuine reason for not being able to check in themselves (phone dead, technical issue), the admin can check them in manually — but only if the admin is also physically at the venue.

---

### Step 5 — Automatic Check-Out

The system checks leaders out automatically in two situations:

1. **The event ends** — when the scheduled end time is reached, the server automatically marks everyone as checked out and closes the event. No action needed from anyone.

2. **A leader leaves the venue** — if a leader's phone reports that they have left the geofence, they are automatically checked out. This gives leadership an accurate record of not just who attended, but for how long.

---

## What Happens After the Event

All attendance data is stored permanently on our servers. Nothing is deleted when an event ends. Leadership can:

- **View the dashboard** for any past event at any time — who attended, who didn't, who left early
- **Download a spreadsheet (CSV)** for any past event directly from the Reports page. The file includes every leader's name, role, unit, whether they checked in or defaulted, what time they arrived and left, whether they were late, and whether their location was verified
- **Browse the full event history** filtered by status (Active, Ended, etc.) with a link to each event's dashboard
- **Export multiple events** — each event can be downloaded separately for record-keeping or reporting to senior leadership

---

## Anti-Fraud Measures

The system includes several layers of protection against dishonest check-ins:

| Measure | What it prevents |
|---|---|
| **GPS geofence** | Checking in from outside the venue |
| **Rotating QR code** | Screenshots of the QR being shared via WhatsApp and used remotely |
| **One device per person per event** | One phone being passed around for multiple people to check in |
| **PIN attempt limit** | Guessing the PIN — after 5 wrong attempts, the system locks for 15 minutes |
| **Face recognition flagging** | Uncertain face matches are held for admin review rather than silently accepted |

---

## Summary

The digital check-in system gives FL Church an accurate, real-time, tamper-resistant record of leader attendance at every event — with no paperwork, no manual counting, and no dependency on a single person to manage the process.

Leaders check in at the venue in seconds. Admins see the full picture instantly. Leadership has the data they need to follow up, encourage, and make informed decisions.
