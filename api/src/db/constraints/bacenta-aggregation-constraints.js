/**
 * Neo4j Constraints and Indexes for Bacenta Aggregation Optimization
 *
 * This file contains cypher commands to create constraints and indexes
 * that optimize database performance for bacenta aggregation queries.
 *
 * Note: For Neo4j Community Edition, we can only use UNIQUE constraints
 * and indexes, not property existence constraints.
 */

// Function to execute constraint and index creation
exports.createBacentaAggregationConstraints = async (driver) => {
  const session = driver.session()
  try {
    console.log('Creating constraints and indexes for bacenta aggregation...')

    // Create constraints
    const constraints = [
      // Node uniqueness constraints
      `CREATE CONSTRAINT bacenta_id_unique IF NOT EXISTS 
       FOR (b:Bacenta) REQUIRE b.id IS UNIQUE`,

      `CREATE CONSTRAINT governorship_id_unique IF NOT EXISTS 
       FOR (g:Governorship) REQUIRE g.id IS UNIQUE`,

      `CREATE CONSTRAINT council_id_unique IF NOT EXISTS 
       FOR (c:Council) REQUIRE c.id IS UNIQUE`,

      `CREATE CONSTRAINT stream_id_unique IF NOT EXISTS 
       FOR (s:Stream) REQUIRE s.id IS UNIQUE`,

      `CREATE CONSTRAINT campus_id_unique IF NOT EXISTS 
       FOR (c:Campus) REQUIRE c.id IS UNIQUE`,

      `CREATE CONSTRAINT oversight_id_unique IF NOT EXISTS 
       FOR (o:Oversight) REQUIRE o.id IS UNIQUE`,

      `CREATE CONSTRAINT denomination_id_unique IF NOT EXISTS 
       FOR (d:Denomination) REQUIRE d.id IS UNIQUE`,

      `CREATE CONSTRAINT service_log_id_unique IF NOT EXISTS 
       FOR (l:ServiceLog) REQUIRE l.id IS UNIQUE`,

      `CREATE CONSTRAINT bussing_record_id_unique IF NOT EXISTS 
       FOR (r:BussingRecord) REQUIRE r.id IS UNIQUE`,

      `CREATE CONSTRAINT aggregate_bussing_record_id_unique IF NOT EXISTS 
       FOR (a:AggregateBussingRecord) REQUIRE a.id IS UNIQUE`,

      `CREATE CONSTRAINT time_graph_date_unique IF NOT EXISTS 
       FOR (t:TimeGraph) REQUIRE t.date IS UNIQUE`,
    ]

    // Create indexes for properties frequently used in WHERE clauses or for sorting
    const indexes = [
      `CREATE INDEX bacenta_name_index IF NOT EXISTS FOR (b:Bacenta) ON (b.name)`,

      `CREATE INDEX aggregate_bussing_week_year IF NOT EXISTS 
       FOR (a:AggregateBussingRecord) ON (a.week, a.year)`,

      `CREATE INDEX time_graph_week_year IF NOT EXISTS 
       FOR (t:TimeGraph) ON (t.date.week, t.date.year)`,

      `CREATE INDEX aggregate_bussing_month IF NOT EXISTS 
       FOR (a:AggregateBussingRecord) ON (a.month)`,

      // Indexes to speed up relationship traversals
      `CREATE INDEX bacenta_current_history IF NOT EXISTS 
       FOR ()-[r:CURRENT_HISTORY]->() ON (r.id)`,

      `CREATE INDEX bussing_record_bussed_on IF NOT EXISTS 
       FOR ()-[r:BUSSED_ON]->() ON (r.id)`,

      `CREATE INDEX has_bussing_aggregate IF NOT EXISTS 
       FOR ()-[r:HAS_BUSSING_AGGREGATE]->() ON (r.id)`,

      `CREATE INDEX has_bussing IF NOT EXISTS 
       FOR ()-[r:HAS_BUSSING]->() ON (r.id)`,

      `CREATE INDEX church_hierarchy_has IF NOT EXISTS 
       FOR ()-[r:HAS]->() ON (r.id)`,
    ]

    // Execute all constraint creation queries
    for (const constraint of constraints) {
      await session.run(constraint)
      console.log(`Executed: ${constraint}`)
    }

    // Execute all index creation queries
    for (const index of indexes) {
      await session.run(index)
      console.log(`Executed: ${index}`)
    }

    console.log('All constraints and indexes created successfully!')

    // Verify constraints and indexes
    const verifyConstraints = await session.run('SHOW CONSTRAINTS')
    console.log(`Number of constraints: ${verifyConstraints.records.length}`)

    const verifyIndexes = await session.run('SHOW INDEXES')
    console.log(`Number of indexes: ${verifyIndexes.records.length}`)

    return {
      success: true,
      constraintsCount: verifyConstraints.records.length,
      indexesCount: verifyIndexes.records.length,
    }
  } catch (error) {
    console.error('Error creating constraints and indexes:', error)
    throw error
  } finally {
    await session.close()
  }
}

// Check existing constraints and indexes
exports.checkExistingConstraintsAndIndexes = async (driver) => {
  const session = driver.session()
  try {
    const constraints = await session.run('SHOW CONSTRAINTS')
    const indexes = await session.run('SHOW INDEXES')

    return {
      constraints: constraints.records.map((record) => record.toObject()),
      indexes: indexes.records.map((record) => record.toObject()),
    }
  } catch (error) {
    console.error('Error checking constraints and indexes:', error)
    throw error
  } finally {
    await session.close()
  }
}
