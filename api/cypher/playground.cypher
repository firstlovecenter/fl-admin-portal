

// This Cypher script is used to merge TimeGraph nodes with the same date

// Merge all TimeGraph nodes with the same date
MATCH (t1:TimeGraph)
WITH t1.date AS date, collect(t1) AS nodes
WHERE size(nodes) > 1
CALL apoc.refactor.mergeNodes(nodes, {
  properties: "combine",
  mergeRels: true
})
YIELD node
RETURN node;

// Create uniqueness constraint on TimeGraph nodes to prevent duplicate dates
CREATE CONSTRAINT TimeGraph_date_unique IF NOT EXISTS
FOR (t:TimeGraph) 
REQUIRE t.date IS UNIQUE;