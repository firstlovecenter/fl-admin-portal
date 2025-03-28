# Neo4j Constraints and Indexes

This directory contains scripts for setting up Neo4j constraints and indexes to optimize database performance.

## Bacenta Aggregation Optimization

The `bacenta-aggregation-constraints.js` file creates constraints and indexes that improve performance for the bacenta aggregation queries. These optimizations are particularly important for:

- Hierarchical aggregation of church data (Bacenta → Governorship → Council → Stream → Campus → Oversight → Denomination)
- BussingRecord aggregation across the church hierarchy
- TimeGraph-based weekly and monthly record keeping

### Key Optimizations

1. **Unique Constraints** - Ensure data integrity with unique IDs for all node types
2. **Compound Indexes** - Optimize week/year filtering for aggregate records
3. **Relationship Indexes** - Speed up traversal across the church hierarchy

### Usage

To apply these constraints and indexes:

```javascript
const { createBacentaAggregationConstraints } = require('./bacenta-aggregation-constraints')
const neo4j = require('neo4j-driver')

async function setupDatabase() {
  const driver = neo4j.driver(
     SECRETS.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'neo4j'
    )
  )
  
  try {
    await createBacentaAggregationConstraints(driver)
    console.log('Database optimized for bacenta aggregation')
  } catch (error) {
    console.error('Failed to set up constraints:', error)
  } finally {
    await driver.close()
  }
}

setupDatabase()
```

## Performance Considerations

- These optimizations are designed specifically for the query patterns in `bacenta-cypher.js`
- The indexes improve query performance but also increase storage requirements
- For very large datasets, you may need to monitor index usage and adjust as needed

## Neo4j Community Edition Limitations

Please note that Neo4j Community Edition only supports:
- Unique constraints
- Non-unique indexes
- Single-property indexes (no composite property indexes)

For more advanced constraints like property existence constraints, node key constraints, or relationship uniqueness constraints, you would need Neo4j Enterprise Edition.
