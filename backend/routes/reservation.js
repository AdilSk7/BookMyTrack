// routes/reservation.js
const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Train = require('../models/Train');
const Setting = require('../models/Setting');

/* ---------------- helpers ---------------- */
function genPNR() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join('');
}
function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d)   { const x = new Date(d); x.setHours(23,59,59,999); return x; }

/** convert a PNR to a deterministic small integer seed */
function pnrToSeed(pnr, modulo = 997) {
  let n = 0;
  for (const ch of String(pnr || '')) n = (n * 33 + ch.charCodeAt(0)) % 2147483647;
  return n % Math.max(1, modulo);
}

// Decide final berth allocation for a passenger
function pickBerthForPassenger(p, groupDefault, accessibleGlobal) {
  const ageNum = Number(p.age);
  const elder = Number.isFinite(ageNum) && ageNum >= 60;

  const wheelchair = !!p.needsWheelchair || !!p.accessible || !!accessibleGlobal;
  const priority   = !!p.needsPrioritySeat;

  if (wheelchair || priority) return 'lower';        // 1) Accessibility first
  if (elder) return 'lower';                         // 2) Elderly
  if (p.berthPreference) return p.berthPreference;   // 3) Explicit choice
  if (groupDefault) return groupDefault;             // 4) Group default
  return 'middle';                                   // 5) Fallback
}

/**
 * Compute a numeric priority score for seat allocation.
 * Higher score -> higher priority for lower / better berths.
 *
 * Metrics used:
 *  - Wheelchair / priority seat  -> huge boost
 *  - Elderly age (>=60)          -> strong boost; older => more
 *  - Elderly female              -> small extra bump (safety)
 *  - Accessible flag             -> small bump
 *  - Original index              -> mild tie-breaker (earlier in request wins)
 */
function computePriorityScore(p, originalIdx) {
  const age = Number(p.age);
  const isElder = Number.isFinite(age) && age >= 60;
  const wheelchair = !!p.needsWheelchair;
  const medicalPriority = !!p.needsPrioritySeat;
  const accessible = !!p.accessible;
  const gender = (p.gender || '').toLowerCase();

  let score = 0;

  // 1) Wheelchair passengers get top priority unconditionally
  if (wheelchair) score += 100;
  
  // Only grant the Priority Checkbox bonus if they are actually 60+ (new business rule)
  if (medicalPriority && isElder) score += 80;

  // 2) Elderly priority, age-weighted
  if (isElder) {
    score += 50;
    // Extra weight for older age, e.g. 60 -> +0, 75 -> +15
    score += Math.max(0, age - 60);
  }

  // 3) Elderly women small bump (safety, comfort)
  if (isElder && gender === 'female') {
    score += 5;
  }

  // 4) General accessibility flag
  if (accessible) {
    score += 10;
  }

  // 5) Earlier passengers in the request keep a slight advantage
  //    (prevents weird reordering for identical profiles)
  score -= (originalIdx || 0) * 0.01;

  return score;
}

/* -------- Seat map + assignment helpers -------- */
const COACH_COUNT = 4;
const SEATS_PER_COACH = 72;

// occupiedSet contains labels like "S1-2"
function buildSeatMap(occupiedSet = new Set(), travelClass = 'SL') {
  let COACH_PREFIX, BAY_SIZE, BERTH_CYCLE, ACCESSIBLE_LOWER_PER_COACH;
  if (travelClass === 'CC') {
      COACH_PREFIX = "C"; BAY_SIZE = 3; BERTH_CYCLE = ['window','middle','aisle']; ACCESSIBLE_LOWER_PER_COACH = 8;
  } else if (travelClass === '2S') {
      COACH_PREFIX = "D"; BAY_SIZE = 3; BERTH_CYCLE = ['window','middle','aisle']; ACCESSIBLE_LOWER_PER_COACH = 8;
  } else if (travelClass === '1A') {
      COACH_PREFIX = "H"; BAY_SIZE = 4; BERTH_CYCLE = ['lower','upper','cabin','coupe']; ACCESSIBLE_LOWER_PER_COACH = 2;
  } else if (travelClass === '2A') {
      COACH_PREFIX = "A"; BAY_SIZE = 4; BERTH_CYCLE = ['lower','upper','side_lower','side_upper']; ACCESSIBLE_LOWER_PER_COACH = 4;
  } else if (travelClass === '3A') {
      COACH_PREFIX = "B"; BAY_SIZE = 8; BERTH_CYCLE = ['lower','middle','upper','lower','middle','upper','side_lower','side_upper']; ACCESSIBLE_LOWER_PER_COACH = 8;
  } else if (travelClass === '3E') {
      COACH_PREFIX = "M"; BAY_SIZE = 8; BERTH_CYCLE = ['lower','middle','upper','lower','middle','upper','side_lower','side_upper']; ACCESSIBLE_LOWER_PER_COACH = 8;
  } else { // SL
      COACH_PREFIX = "S"; BAY_SIZE = 8; BERTH_CYCLE = ['lower','middle','upper','lower','middle','upper','side_lower','side_upper']; ACCESSIBLE_LOWER_PER_COACH = 8;
  }

  const seats = [];
  for (let c = 1; c <= COACH_COUNT; c++) {
    const coach = `${COACH_PREFIX}${c}`;
    let lbAssigned = 0;
    for (let i = 1; i <= SEATS_PER_COACH; i++) {
      const idxInBay = (i - 1) % BAY_SIZE;
      const berth = BERTH_CYCLE[idxInBay];
      const accessibleZone = (['lower', 'window'].includes(berth) && lbAssigned < ACCESSIBLE_LOWER_PER_COACH);
      if (['lower', 'window'].includes(berth)) lbAssigned++;

      const seatLabel = `${coach}-${i}`;
      seats.push({
        coach,
        seatNumber: i,
        seatLabel,
        berth,
        accessibleZone,
        taken: occupiedSet.has(seatLabel),
      });
    }
  }
  return seats;
}
function takeSeat(seat) { seat.taken = true; return seat; }

/** Iterate an array starting at `offset` (wraparound) and return first item passing `pred` */
function findRotated(list, pred, offset) {
  const n = list.length;
  for (let k = 0; k < n; k++) {
    const idx = (offset + k) % n;
    const item = list[idx];
    if (pred(item)) return item;
  }
  return null;
}

/** Find nearest seat (by absolute seatNumber distance) within a coach that satisfies pred. */
function findNearestInCoach(seatsByCoach, coach, targetSeatNo, pred) {
  const arr = seatsByCoach.get(coach) || [];
  if (!arr.length) return null;

  // Binary search for insertion index near target
  let lo = 0, hi = arr.length - 1, pos = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].seatNumber < targetSeatNo) { lo = mid + 1; pos = lo; }
    else { hi = mid - 1; pos = mid; }
  }

  // Expand outwards from pos to find the closest free seat that matches
  let l = pos, r = pos + 1;
  while (l >= 0 || r < arr.length) {
    if (l >= 0) {
      const s = arr[l];
      if (!s.taken && pred(s)) return s;
      l--;
    }
    if (r < arr.length) {
      const s = arr[r];
      if (!s.taken && pred(s)) return s;
      r++;
    }
  }
  return null;
}

/**
 * Greedy seat assigner with proximity:
 * - keeps a group's members in the same coach
 * - companions sit next to their anchor when possible (nearest in same coach)
 * - other group members sit near the last assigned member (compact block)
 * - wheelchair/priority target lower accessible zone
 * - rotation seed avoids always starting at S1-2 on empty maps
 */
function assignCoachesAndSeats(passengersOrdered, occupiedSet, seedForRotation, travelClass = 'SL') {
  const allSeats = buildSeatMap(occupiedSet, travelClass);
  const baseOffset = seedForRotation % Math.max(1, allSeats.length);

  // Build quick lookups per coach sorted by seatNumber
  const seatsByCoach = new Map();
  for (const s of allSeats) {
    if (!seatsByCoach.has(s.coach)) seatsByCoach.set(s.coach, []);
    seatsByCoach.get(s.coach).push(s);
  }
  for (const [k, arr] of seatsByCoach) arr.sort((a,b) => a.seatNumber - b.seatNumber);

  function pickBestSeatFor(pax, preferredCoach, localOffset) {
    const tests = [];

    // 1) wheelchair/priority → lower in accessible zone
    if (pax.needsWheelchair || pax.needsPrioritySeat || pax.accessible) {
      tests.push(s => !s.taken && ['lower','window'].includes(s.berth) && s.accessibleZone);
    }
    // 2) exact berth match
    if (pax.berthAllocated) {
      tests.push(s => !s.taken && s.berth === pax.berthAllocated);
    }
    // 3) any lower or window
    tests.push(s => !s.taken && ['lower','window'].includes(s.berth));
    // 4) anything free
    tests.push(s => !s.taken);

    for (const test of tests) {
      if (preferredCoach) {
        const sameCoachList = seatsByCoach.get(preferredCoach) || [];
        if (sameCoachList.length) {
          const off = localOffset % sameCoachList.length;
          const rotated = findRotated(sameCoachList, test, off);
          if (rotated) return takeSeat(rotated);
        }
      }
      // any coach
      const anyCoach = findRotated(allSeats, test, localOffset % allSeats.length);
      if (anyCoach) return takeSeat(anyCoach);
    }
    return null;
  }

  const result = [];
  const assignedByOriginalIdx = new Map();   // originalIdx -> {coach, seatNumber}
  const groups = new Map();                  // groupId -> members list

  // group passengers (already ordered by your logic)
  passengersOrdered.forEach(p => {
    const key = p.groupId || '_solo';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  });

  let groupCounter = 0;
  for (const [, members] of groups) {
    let chosenCoach = null;
    let lastGroupSeatNo = null; // helps pack the group together
    const groupOffset = (baseOffset + groupCounter * 13) % allSeats.length; // 13 = small prime

    for (let i = 0; i < members.length; i++) {
      const pax = members[i];

      // If companion, try to sit next to anchor in the same coach
      if (Number.isInteger(pax.companionOf)) {
        const anchor = assignedByOriginalIdx.get(pax.companionOf);
        if (anchor) {
          const near = findNearestInCoach(
            seatsByCoach,
            anchor.coach,
            anchor.seatNumber,
            s => true // any free seat near anchor
          );
          if (near) {
            takeSeat(near);
            result.push({ ...pax, coach: near.coach, seatNumber: near.seatNumber, seatLabel: near.seatLabel, berthAllocated: near.berth });
            assignedByOriginalIdx.set(pax.originalIdx ?? pax.companionOf, { coach: near.coach, seatNumber: near.seatNumber });
            chosenCoach = chosenCoach || near.coach;
            lastGroupSeatNo = near.seatNumber;
            continue;
          }
        }
      }

      // Non-companions (or fallback): try to keep group compact in chosenCoach
      if (chosenCoach && lastGroupSeatNo != null) {
        const near = findNearestInCoach(
          seatsByCoach,
          chosenCoach,
          lastGroupSeatNo + 1, // try just ahead
          s => true
        );
        if (near) {
          takeSeat(near);
          result.push({ ...pax, coach: near.coach, seatNumber: near.seatNumber, seatLabel: near.seatLabel, berthAllocated: near.berth });
          assignedByOriginalIdx.set(pax.originalIdx ?? -1, { coach: near.coach, seatNumber: near.seatNumber });
          lastGroupSeatNo = near.seatNumber;
          continue;
        }
      }

      // Otherwise pick best seat (prefer same coach if we already have one)
      const localOffset = (groupOffset + i * 7) % allSeats.length; // 7 = small prime
      const seat = pickBestSeatFor(pax, chosenCoach, localOffset);
      if (seat) {
        if (!chosenCoach) chosenCoach = seat.coach;
        lastGroupSeatNo = seat.seatNumber;
        result.push({ ...pax, coach: seat.coach, seatNumber: seat.seatNumber, seatLabel: seat.seatLabel, berthAllocated: seat.berth });
        assignedByOriginalIdx.set(pax.originalIdx ?? -1, { coach: seat.coach, seatNumber: seat.seatNumber });
      } else {
        // no seat found (unlikely)
        result.push({ ...pax });
      }
    }

    groupCounter++;
  }

  return result;
}

/* -------- Fare helpers (server-side pricing) -------- */
// Compute fare based on train's dynamic baseFare/classFares
async function computeFare(train, travelClass, passengers = []) {
  const per = [];
  let total = 0;
  
  let base = train.baseFare;
  if (train.classFares) {
      if (typeof train.classFares.get === 'function') {
          if (train.classFares.get(travelClass)) base = train.classFares.get(travelClass);
      } else {
          if (train.classFares[travelClass]) base = train.classFares[travelClass];
      }
  }

  for (const p of passengers) {
    let f = base;

    // Example rules — tweak as needed
    const age = Number(p.age);
    if (Number.isFinite(age) && age < 12) f *= 0.5;   // child 50%
    if (Number.isFinite(age) && age >= 60) f *= 0.85; // senior 15% off
    if (p?.needsWheelchair || p?.needsPrioritySeat) f += 50; // service fee

    f = Math.round(f);
    per.push(f);
    total += f;
  }

  // Add flat Convenience Fee per booking (not per pax) sourced from Platform Settings (defaults to 29 if unset)
  let CONVENIENCE_FEE = 29;
  try {
     const reqFee = await Setting.findOne({ key: 'base_fee' }).lean();
     if (reqFee && !isNaN(Number(reqFee.value))) {
        CONVENIENCE_FEE = Number(reqFee.value);
     }
  } catch (err) { }
  
  total += CONVENIENCE_FEE;

  return { total, per, convenienceFee: CONVENIENCE_FEE };
}



/* ---------------- routes ---------------- */

// ---- POST /book ----
// Create booking as PENDING (no seats yet) and compute fare
router.post('/book', async (req, res) => {
  try {
    let { userId, from, to, trainNo, journeyDate, travelClass, berthPreference, accessible, passengers = [] } = req.body;

    userId = (userId || '').trim();
    travelClass = (travelClass || 'SL').trim();
    from = (from || '').trim();
    to = (to || '').trim();
    trainNo = (trainNo || '').trim();
    berthPreference = (berthPreference || '').trim().toLowerCase();
    const accessibleGlobal = !!accessible;

    if (!userId || !from || !to || !trainNo || !journeyDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch Train Data
    const train = await Train.findOne({ trainNo });
    if (!train) {
      return res.status(404).json({ error: 'Selected train not found in database.' });
    }

    // generate PNR first so we can use it later at payment time
    const pnr = genPNR();

    // --- Normalize passenger list ---
    const pax = Array.isArray(passengers) && passengers.length > 0
      ? passengers.map((p) => ({
          name: (p.name || 'Passenger').trim(),
          age: Number(p.age),
          gender: (p.gender || 'other').toLowerCase(),
          berthPreference: (p.berthPreference || '').toLowerCase(),
          accessible: !!p.accessible,
          needsWheelchair: !!p.needsWheelchair,
          needsPrioritySeat: !!p.needsPrioritySeat,
          companionOf: Number.isInteger(p.companionOf) ? p.companionOf : null,
          groupId: (p.groupId || null)
        }))
      : [{
          name: 'Main Passenger',
          age: 30,
          gender: 'other',
          berthPreference: berthPreference || '',
          accessible: accessibleGlobal,
          needsWheelchair: accessibleGlobal,
          needsPrioritySeat: false,
          companionOf: null,
          groupId: null
        }];

    // --- Allocate berth type (not seat numbers) for everyone ---
    const paxWithAllocation = pax.map((p, idx) => {
      const berthAllocated = pickBerthForPassenger(p, berthPreference, accessibleGlobal);
      const priorityScore = computePriorityScore(p, idx);
      return {
        ...p,
        berthAllocated,
        priorityScore,
        originalIdx: idx
      };
    });

    // --- Validate companion indices ---
    paxWithAllocation.forEach((p, idx) => {
      if (Number.isInteger(p.companionOf)) {
        if (p.companionOf < 0 || p.companionOf >= paxWithAllocation.length) {
          p.companionOf = null;
        }
      }
    });

    // --- Group by groupId and reorder with priority ---
    const groups = new Map();
    paxWithAllocation.forEach((p) => {
      const key = p.groupId || '_solo';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    });

    groups.forEach((arr, key) => {
      const isCompanion = p => Number.isInteger(p.companionOf);

      // anchors = main passengers in the group (not companions)
      const anchors = arr.filter(p => !isCompanion(p));

      // Sort anchors by descending priorityScore
      anchors.sort((a, b) => b.priorityScore - a.priorityScore);

      const ordered = [];

      // For each anchor, place them, then their companions (also sorted by priority)
      anchors.forEach(anchor => {
        ordered.push(anchor);
        const companions = arr
          .filter(p => isCompanion(p) && p.companionOf === anchor.originalIdx)
          .sort((a, b) => b.priorityScore - a.priorityScore);
        ordered.push(...companions);
      });

      // Remaining passengers (unattached companions or leftovers) go next by priority
      const leftovers = arr
        .filter(p => !ordered.includes(p))
        .sort((a, b) => b.priorityScore - a.priorityScore);

      groups.set(key, [...ordered, ...leftovers]);
    });

    // flatten to final passenger order
    const paxFinal = Array.from(groups.values()).flat();

    // --- Fare quote (server-side) using exact baseFare ---
    const quote = await computeFare(train, travelClass, paxFinal);

    // --- Save reservation as PENDING (no coach/seat yet) ---
    const reservation = new Reservation({
      userId,
      from,
      to,
      trainNo: train.trainNo,
      trainName: train.trainName,
      journeyDate: new Date(journeyDate),
      travelClass: travelClass,
      berthPreference: berthPreference || '',
      accessible: accessibleGlobal,
      passengers: paxFinal,
      pnr,
      status: 'Pending',
      fareTotal: quote.total,
      farePerPax: quote.per,
      currency: 'INR'
    });

    await reservation.save();

    return res.status(201).json({
      _id: reservation._id,
      pnr: reservation.pnr,
      status: reservation.status,
      passengers: reservation.passengers,
      fareTotal: reservation.fareTotal,
      convenienceFee: quote.convenienceFee,
      currency: reservation.currency
    });
  } catch (err) {
    console.error('[BOOKING ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

/* ------------- other routes ------------- */

// POST /confirm-pay/:id
// Marks reservation as Paid and assigns seats at payment time
router.post('/confirm-pay/:id', async (req, res) => {
  try {
    const r = await Reservation.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Reservation not found' });

    if (r.status === 'Cancelled') {
      return res.status(400).json({ error: 'Booking is cancelled' });
    }

    // ✅ Idempotent: skip only if seats already exist for everyone
    const seatsAlreadyAssigned =
      Array.isArray(r.passengers) &&
      r.passengers.length > 0 &&
      r.passengers.every(p => (p.coach && p.seatNumber) || p.seatLabel);

    if (seatsAlreadyAssigned) {
      // ensure status is at least Paid
      if (r.status !== 'Paid' && r.status !== 'Confirmed') {
        r.status = 'Paid';
        await r.save();
      }
      return res.json(r);
    }

    // Optional: refresh fare in case anything changed
    const train = await Train.findOne({ trainNo: r.trainNo });
    if (train) {
      const freshQuote = await computeFare(train, r.travelClass, r.passengers);
      r.fareTotal = freshQuote.total;
      r.farePerPax = freshQuote.per;
    }
    r.currency = 'INR';

    // Build occupied set for same route/date (exclude this reservation)
    const dayStart = startOfDay(r.journeyDate);
    const dayEnd   = endOfDay(r.journeyDate);
    const existing = await Reservation.find(
      {
        _id: { $ne: r._id },
        from: r.from,
        to: r.to,
        travelClass: r.travelClass || 'SL',
        journeyDate: { $gte: dayStart, $lte: dayEnd },
        status: { $ne: 'Cancelled' }
      },
      { passengers: 1 }
    ).lean();

    const occupied = new Set();
    for (const e of existing) {
      if (!Array.isArray(e.passengers)) continue;
      for (const p of e.passengers) {
        if (p.coach && p.seatNumber) occupied.add(`${p.coach}-${p.seatNumber}`);
        else if (p.seatLabel)        occupied.add(p.seatLabel);
      }
    }

    // Assign seats now (payment time)
    const rotationSeed = pnrToSeed(r.pnr);
    const paxWithSeats = assignCoachesAndSeats(r.passengers, occupied, rotationSeed, r.travelClass || 'SL');

    r.passengers = paxWithSeats;
    r.status = 'Paid'; // or 'Confirmed' if you prefer that wording
    await r.save();

    return res.json(r);
  } catch (err) {
    console.error('[CONFIRM PAY ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const items = await Reservation.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    if (!items || items.length === 0) return res.status(404).json({ error: 'No bookings found' });
    return res.json(items);
  } catch (err) {
    console.error('[RESV USER ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /pnr/:pnr
router.get('/pnr/:pnr', async (req, res) => {
  try {
    const item = await Reservation.findOne({ pnr: req.params.pnr });
    if (!item) return res.status(404).json({ error: 'PNR not found' });
    return res.json(item);
  } catch (err) {
    console.error('[RESV PNR ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /cancel/:id
router.delete('/cancel/:id', async (req, res) => {
  try {
    const r = await Reservation.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Booking not found' });
    r.status = 'Cancelled';
    await r.save();
    return res.json({ message: 'Booking cancelled successfully', booking: r });
  } catch (err) {
    console.error('[RESV CANCEL ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
