# Bacenta Data Scripts

This directory contains utility scripts for working with bacenta data in the First Love Admin Portal.

## Bacenta Aggregation Script

The `run-bacenta-aggregation.js` script allows you to run the bacenta aggregation process from the command line. This is useful for:

- Testing aggregation logic without deploying to production
- Running manual aggregations for specific time periods
- Fixing data issues by re-running aggregations
- Debugging aggregation queries

### Usage

```bash
# Make the script executable (first time only)
chmod +x run-bacenta-aggregation.js

# Run all aggregations for the current week
node run-bacenta-aggregation.js

# Show help information
node run-bacenta-aggregation.js --help

# Run only specific aggregation levels
node run-bacenta-aggregation.js --governorship --council

# Run aggregation for a specific week and year
node run-bacenta-aggregation.js --all --week 42 --year 2023

# Zero out null bussing records only
node run-bacenta-aggregation.js --zero-nulls
```

### Available Options

- `--help`, `-h`: Show help information
- `--all`: Run all aggregations (default if no specific aggregation is selected)
- `--governorship`: Run only governorship aggregation
- `--council`: Run only council aggregation
- `--stream`: Run only stream aggregation
- `--campus`: Run only campus aggregation
- `--oversight`: Run only oversight aggregation
- `--denomination`: Run only denomination aggregation
- `--zero-nulls`: Zero out null bussing records
- `--week <number>`: Specify week (defaults to current week)
- `--year <number>`: Specify year (defaults to current year)

### Environment Setup

The script uses the same environment variables as the main application. Make sure your `.env` file is properly configured with:

```
NEO4J_URI=bolt://your-neo4j-host:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

## Troubleshooting

If you encounter errors when running the script:

1. Check that Neo4j is running and accessible
2. Verify your environment variables are correctly set
3. Ensure you have the necessary permissions to access the database
4. Check for any syntax errors in the aggregation queries
