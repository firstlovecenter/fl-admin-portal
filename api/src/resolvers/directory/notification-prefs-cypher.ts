// Per-category reminder preferences, stored as coalesced boolean flags on the
// Member node. Default ON (opt-out): an unset flag reads as `true` via
// `coalesce`, so a brand-new member is subscribed to everything until they mute
// a category. Each flag is its own scalar property, so a single-category toggle
// is a single-property SET — no read-modify-write race.
//
// The reminder jobs MUST gate on these before sending, e.g.
//   WHERE coalesce(leader.notifyBanking, true) = true

export const READ_NOTIFICATION_PREFERENCES = `
  MATCH (member:Member { id: $userId })
  RETURN coalesce(member.notifyServices, true) AS services,
         coalesce(member.notifyBanking, true) AS banking,
         coalesce(member.notifyDefaulters, true) AS defaulters,
         coalesce(member.notifyArrivals, true) AS arrivals
`

// Writes ONLY the flag named by $category and leaves the other two physically
// untouched, via the conditional-FOREACH idiom (the FOREACH body runs on a
// one-element list for the matching category, an empty list otherwise). This
// keeps each toggle a single-property write — no read-modify-write of the
// unrelated flags — so concurrent toggles of different categories can't clobber
// each other, and unset categories stay unset (still default-ON via coalesce on
// read). Category is matched by value, never interpolated into a property name.
export const SET_NOTIFICATION_PREFERENCE = `
  MATCH (member:Member { id: $userId })
  FOREACH (_ IN CASE WHEN $category = 'SERVICES' THEN [1] ELSE [] END |
    SET member.notifyServices = $enabled)
  FOREACH (_ IN CASE WHEN $category = 'BANKING' THEN [1] ELSE [] END |
    SET member.notifyBanking = $enabled)
  FOREACH (_ IN CASE WHEN $category = 'DEFAULTERS' THEN [1] ELSE [] END |
    SET member.notifyDefaulters = $enabled)
  FOREACH (_ IN CASE WHEN $category = 'ARRIVALS' THEN [1] ELSE [] END |
    SET member.notifyArrivals = $enabled)
  RETURN coalesce(member.notifyServices, true) AS services,
         coalesce(member.notifyBanking, true) AS banking,
         coalesce(member.notifyDefaulters, true) AS defaulters,
         coalesce(member.notifyArrivals, true) AS arrivals
`
