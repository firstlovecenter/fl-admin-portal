// Constraints to optimize governorship service aggregation queries
// Index on ServiceRecord ID for efficient component lookups
CREATE INDEX serviceRecord_id_idx IF NOT EXISTS FOR (s:ServiceRecord) ON (s.id);

// Constraint for AggregateServiceRecord uniqueness based on composite key
CREATE CONSTRAINT uniqueAggregateServiceRecordWeekYearLog IF NOT EXISTS ON (a:AggregateServiceRecord) ASSERT (a.week + '-' + a.year + '-' + a.logId) IS UNIQUE;

// Index on ServiceLog IDs to speed up MERGE operations
CREATE INDEX serviceLog_id_idx IF NOT EXISTS FOR (l:ServiceLog) ON (l.id);

// Improve traversal from Governorship to ServiceRecord with relationship index
CREATE INDEX governorship_current_history_idx IF NOT EXISTS FOR ()-[r:CURRENT_HISTORY]->() ON (r.timestamp);

// Index for HAS_SERVICE relationships
CREATE INDEX has_service_idx IF NOT EXISTS FOR ()-[r:HAS_SERVICE]->() ON (r.timestamp);

// Make sure aggregate has a property for logId to support constraint
// Add this to your data model or schema
