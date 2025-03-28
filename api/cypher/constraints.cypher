// "ServiceDay"
// "Title"
// "MaritalStatus"
// "Gender"
// "Ministry"
// "Member"
// "TimeGraph"
// "Campus"
// "Town"
// "Bacenta"
// "Sonta"
// "Basonta"
// "HistoryLog"
// "User"
// "Occupation"
// "ServiceLog"
// "ServiceRecord"
// "ClosedBacenta"
// "NoService"
// "Council"
// "Stream"
// "Governorship"
// "LastBankingCode"
// "Fellowship"
// "ClosedFellowship"
// "Vacation"
// "ClosedGovernorship"
// "IC"
// "BussingRecord"
// "ArrivalsCodeOfTheDay"
// "Active"
// "Graduated"
// "LastPaySwitchTransactionId"
// "RegistrationLog"
// "SwellDate"
// "Archived"
// "Sheep"
// "Deer"
// "Denomination"
// "Goat"
// "ClosedCouncil"
// "Oversight"
// "EquipmentRecord"
// "VehicleRecord"
// "EquipmentDate"
// "AggregateServiceRecord"
// "AggregateBussingRecord"
// "Inactive"
// "IDL"
// "IMCL"
// "PastoralComment"
// "MissedChurchComment"
// "BacentaCycle"
// "GovernorshipCycle"
// "CouncilCycle"
// "LastBacentaCode"
// "BussingSociety"
// "PastoralCycle"
// "Target"
// "Lost"
// "TelepastoringActivity"
// "VisitationActivity"
// "PrayerActivity"
// "IndoorVenue"
// "OutreachVenue"
// "OutdoorVenue"
// "Offering"
// "Transaction"
// "Online"
// "ClosedCampus"
// "MembershipData"
// "SpiritualProgression"
// "CreativeArts"
// "LifeProgression"
// "Hub"
// "AccountTransaction"
// "HubFellowship"
// "ClosedStream"
// "HubCouncil"
// "ClosedHub"
// "RehearsalRecord"
// "AggregateRehearsalRecord"
// "Closedgovernorship"
// "ClosedMinistry"
// "MinistryAttendanceRecord"
// "ClosedHubCouncil"
// "StageAttendanceRecord"
// "AggregateStageAttendanceRecord"
// "AggregateMinistryMeetingRecord"

CREATE CONSTRAINT uniqueServiceDay IF NOT EXISTS ON (s:ServiceDay) ASSERT s.day IS UNIQUE;
CREATE CONSTRAINT uniqueTitle IF NOT EXISTS ON (t:Title) ASSERT t.title IS UNIQUE;
CREATE CONSTRAINT uniqueMaritalStatus IF NOT EXISTS ON (m:MaritalStatus) ASSERT m.status IS UNIQUE;
CREATE CONSTRAINT uniqueGender IF NOT EXISTS ON (g:Gender) ASSERT g.gender IS UNIQUE;
CREATE CONSTRAINT uniqueMinistry IF NOT EXISTS ON (m:Ministry) ASSERT m.id IS UNIQUE;
CREATE CONSTRAINT uniqueMember IF NOT EXISTS ON (m:Member) ASSERT m.id IS UNIQUE;
CREATE CONSTRAINT uniqueMemberWhatsappNumber IF NOT EXISTS ON (m:Member) ASSERT m.whatsappNumber IS UNIQUE;
CREATE CONSTRAINT uniqueMemberEmail IF NOT EXISTS ON (m:Member) ASSERT m.email IS UNIQUE;

CREATE CONSTRAINT uniqueTimeGraph IF NOT EXISTS ON (t:TimeGraph) ASSERT t.date IS UNIQUE;
CREATE CONSTRAINT uniqueCampus IF NOT EXISTS ON (c:Campus) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueTown IF NOT EXISTS ON (t:Town) ASSERT t.id IS UNIQUE;
// CREATE CONSTRAINT uniqueBacenta IF NOT EXISTS ON (b:Bacenta) ASSERT b.id IS UNIQUE;
CREATE CONSTRAINT uniqueSonta IF NOT EXISTS ON (s:Sonta) ASSERT s.id IS UNIQUE;
CREATE CONSTRAINT uniqueBasonta IF NOT EXISTS ON (b:Basonta) ASSERT b.id IS UNIQUE;
CREATE CONSTRAINT uniqueHistoryLog IF NOT EXISTS ON (h:HistoryLog) ASSERT h.id IS UNIQUE;
CREATE CONSTRAINT uniqueUser IF NOT EXISTS ON (u:User) ASSERT u.id IS UNIQUE;
CREATE CONSTRAINT uniqueOccupation IF NOT EXISTS ON (o:Occupation) ASSERT o.id IS UNIQUE;
CREATE CONSTRAINT uniqueServiceLog IF NOT EXISTS ON (s:ServiceLog) ASSERT s.id IS UNIQUE;
CREATE CONSTRAINT uniqueServiceRecord IF NOT EXISTS ON (s:ServiceRecord) ASSERT s.id IS UNIQUE;
CREATE CONSTRAINT uniqueServiceRecordTransaction IF NOT EXISTS ON (s:ServiceRecord) ASSERT s.transactionReference IS UNIQUE;

CREATE CONSTRAINT uniqueClosedBacenta IF NOT EXISTS ON (c:ClosedBacenta) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueNoService IF NOT EXISTS ON (n:NoService) ASSERT n.id IS UNIQUE;
CREATE CONSTRAINT uniqueCouncil IF NOT EXISTS ON (c:Council) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueStream IF NOT EXISTS ON (s:Stream) ASSERT s.id IS UNIQUE;
CREATE CONSTRAINT uniqueGovernorship IF NOT EXISTS ON (c:Governorship) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueLastBankingCode IF NOT EXISTS ON (l:LastBankingCode) ASSERT l.number IS UNIQUE;
CREATE CONSTRAINT uniqueFellowship IF NOT EXISTS ON (f:Fellowship) ASSERT f.id IS UNIQUE;
CREATE CONSTRAINT uniqueClosedFellowship IF NOT EXISTS ON (c:ClosedFellowship) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueVacation IF NOT EXISTS ON (v:Vacation) ASSERT v.id IS UNIQUE;
CREATE CONSTRAINT uniqueClosedGovernorship IF NOT EXISTS ON (c:ClosedGovernorship) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueIC IF NOT EXISTS ON (i:Red) ASSERT i.id IS UNIQUE;
CREATE CONSTRAINT uniqueBussingRecord IF NOT EXISTS ON (b:BussingRecord) ASSERT b.id IS UNIQUE;
CREATE CONSTRAINT uniqueArrivalsCodeOfTheDay IF NOT EXISTS ON (a:ArrivalsCodeOfTheDay) ASSERT a.code IS UNIQUE;
CREATE CONSTRAINT uniqueActive IF NOT EXISTS ON (a:Active) ASSERT a.id IS UNIQUE;
CREATE CONSTRAINT uniqueGraduated IF NOT EXISTS ON (g:Green) ASSERT g.id IS UNIQUE;
CREATE CONSTRAINT uniqueLastPaySwitchTransactionId IF NOT EXISTS ON (l:LastPaySwitchTransactionId) ASSERT l.id IS UNIQUE;
CREATE CONSTRAINT uniqueRegistrationLog IF NOT EXISTS ON (r:RegistrationLog) ASSERT r.id IS UNIQUE;
CREATE CONSTRAINT uniqueSwellDate IF NOT EXISTS ON (s:SwellDate) ASSERT s.date IS UNIQUE;
CREATE CONSTRAINT uniqueArchived IF NOT EXISTS ON (a:Archived) ASSERT a.id IS UNIQUE;
CREATE CONSTRAINT uniqueSheep IF NOT EXISTS ON (s:Sheep) ASSERT s.id IS UNIQUE;
CREATE CONSTRAINT uniqueDeer IF NOT EXISTS ON (d:Deer) ASSERT d.id IS UNIQUE;
CREATE CONSTRAINT uniqueDenomination IF NOT EXISTS ON (d:Denomination) ASSERT d.id IS UNIQUE;
CREATE CONSTRAINT uniqueGoat IF NOT EXISTS ON (g:Goat) ASSERT g.id IS UNIQUE;
CREATE CONSTRAINT uniqueClosedCouncil IF NOT EXISTS ON (c:ClosedCouncil) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueOversight IF NOT EXISTS ON (o:Oversight) ASSERT o.id IS UNIQUE;
CREATE CONSTRAINT uniqueEquipmentRecord IF NOT EXISTS ON (e:EquipmentRecord) ASSERT e.id IS UNIQUE;
CREATE CONSTRAINT uniqueVehicleRecord IF NOT EXISTS ON (v:VehicleRecord) ASSERT v.id IS UNIQUE;
CREATE CONSTRAINT uniqueEquipmentDate IF NOT EXISTS ON (e:EquipmentDate) ASSERT e.date IS UNIQUE;



CREATE CONSTRAINT uniqueAggregateServiceRecord IF NOT EXISTS ON (a:AggregateServiceRecord) ASSERT a.id IS UNIQUE;
CREATE CONSTRAINT uniqueAggregateBussingRecord IF NOT EXISTS ON (a:AggregateBussingRecord) ASSERT a.id IS UNIQUE;
CREATE CONSTRAINT uniqueInactive IF NOT EXISTS ON (i:Inactive) ASSERT i.id IS UNIQUE;
CREATE CONSTRAINT uniqueIDL IF NOT EXISTS ON (i:IDL) ASSERT i.id IS UNIQUE;
CREATE CONSTRAINT uniqueIMCL IF NOT EXISTS ON (i:IMCL) ASSERT i.id IS UNIQUE;
CREATE CONSTRAINT uniquePastoralComment IF NOT EXISTS ON (p:PastoralComment) ASSERT p.id IS UNIQUE;
CREATE CONSTRAINT uniqueMissedChurchComment IF NOT EXISTS ON (m:MissedChurchComment) ASSERT m.id IS UNIQUE;
CREATE CONSTRAINT uniqueBacentaCycle IF NOT EXISTS ON (b:BacentaCycle) ASSERT b.id IS UNIQUE;
CREATE CONSTRAINT uniqueGovernorshipCycle IF NOT EXISTS ON (c:GovernorshipCycle) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueCouncilCycle IF NOT EXISTS ON (c:CouncilCycle) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueLastBacentaCode IF NOT EXISTS ON (l:LastBacentaCode) ASSERT l.code IS UNIQUE;
CREATE CONSTRAINT uniqueBussingSociety IF NOT EXISTS ON (b:BussingSociety) ASSERT b.id IS UNIQUE;
CREATE CONSTRAINT uniquePastoralCycle IF NOT EXISTS ON (p:PastoralCycle) ASSERT p.id IS UNIQUE;
CREATE CONSTRAINT uniqueTarget IF NOT EXISTS ON (t:Target) ASSERT t.id IS UNIQUE;
CREATE CONSTRAINT uniqueLost IF NOT EXISTS ON (l:Lost) ASSERT l.id IS UNIQUE;
CREATE CONSTRAINT uniqueTelepastoringActivity IF NOT EXISTS ON (t:TelepastoringActivity) ASSERT t.id IS UNIQUE;
CREATE CONSTRAINT uniqueVisitationActivity IF NOT EXISTS ON (v:VisitationActivity) ASSERT v.id IS UNIQUE;
CREATE CONSTRAINT uniquePrayerActivity IF NOT EXISTS ON (p:PrayerActivity) ASSERT p.id IS UNIQUE;
CREATE CONSTRAINT uniqueIndoorVenue IF NOT EXISTS ON (i:IndoorVenue) ASSERT i.id IS UNIQUE;
CREATE CONSTRAINT uniqueOutreachVenue IF NOT EXISTS ON (o:OutreachVenue) ASSERT o.id IS UNIQUE;
CREATE CONSTRAINT uniqueOutdoorVenue IF NOT EXISTS ON (o:OutdoorVenue) ASSERT o.id IS UNIQUE;
CREATE CONSTRAINT uniqueOffering IF NOT EXISTS ON (o:Offering) ASSERT o.id IS UNIQUE;
CREATE CONSTRAINT uniqueTransaction IF NOT EXISTS ON (t:Transaction) ASSERT t.id IS UNIQUE;
CREATE CONSTRAINT uniqueTransactionReference IF NOT EXISTS ON (t:Transaction) ASSERT t.transactionReference IS UNIQUE;

CREATE CONSTRAINT uniqueOnline IF NOT EXISTS ON (o:Online) ASSERT o.id IS UNIQUE;
CREATE CONSTRAINT uniqueClosedCampus IF NOT EXISTS ON (c:ClosedCampus) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueMembershipData IF NOT EXISTS ON (m:MembershipData) ASSERT m.id IS UNIQUE;
CREATE CONSTRAINT uniqueSpiritualProgression IF NOT EXISTS ON (s:SpiritualProgression) ASSERT s.id IS UNIQUE;
CREATE CONSTRAINT uniqueCreativeArts IF NOT EXISTS ON (c:CreativeArts) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueLifeProgression IF NOT EXISTS ON (l:LifeProgression) ASSERT l.id IS UNIQUE;
CREATE CONSTRAINT uniqueHub IF NOT EXISTS ON (h:Hub) ASSERT h.id IS UNIQUE;
CREATE CONSTRAINT uniqueAccountTransaction IF NOT EXISTS ON (a:AccountTransaction) ASSERT a.id IS UNIQUE;
CREATE CONSTRAINT uniqueHubFellowship IF NOT EXISTS ON (h:HubFellowship) ASSERT h.id IS UNIQUE;
CREATE CONSTRAINT uniqueClosedStream IF NOT EXISTS ON (c:ClosedStream) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueHubCouncil IF NOT EXISTS ON (h:HubCouncil) ASSERT h.id IS UNIQUE;
CREATE CONSTRAINT uniqueClosedHub IF NOT EXISTS ON (c:ClosedHub) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueRehearsalRecord IF NOT EXISTS ON (r:RehearsalRecord) ASSERT r.id IS UNIQUE;
CREATE CONSTRAINT uniqueAggregateRehearsalRecord IF NOT EXISTS ON (a:AggregateRehearsalRecord) ASSERT a.id IS UNIQUE;
CREATE CONSTRAINT uniqueClosedgovernorship IF NOT EXISTS ON (c:Closedgovernorship) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueClosedMinistry IF NOT EXISTS ON (c:ClosedMinistry) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueMinistryAttendanceRecord IF NOT EXISTS ON (m:MinistryAttendanceRecord) ASSERT m.id IS UNIQUE;
CREATE CONSTRAINT uniqueClosedHubCouncil IF NOT EXISTS ON (c:ClosedHubCouncil) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT uniqueStageAttendanceRecord IF NOT EXISTS ON (s:StageAttendanceRecord) ASSERT s.id IS UNIQUE;
CREATE CONSTRAINT uniqueAggregateStageAttendanceRecord IF NOT EXISTS ON (a:AggregateStageAttendanceRecord) ASSERT a.id IS UNIQUE;
CREATE CONSTRAINT uniqueAggregateMinistryMeetingRecord IF NOT EXISTS ON (a:AggregateMinistryMeetingRecord) ASSERT a.id IS UNIQUE;
