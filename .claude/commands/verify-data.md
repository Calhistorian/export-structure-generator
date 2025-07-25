# Database Verification

## Core Instruction

When working on persistence-related features or debugging database issues in the Nolocron Agent Orchestrator, you MUST verify database operations by directly querying the database rather than relying solely on logs or application output.

## Database Locations

```bash
# Main application database
MAIN_DB="/Users/holocron/Library/Application Support/Nolocron-beta/config/database/nolocron.db"

# Block storage database (conversations and messages)
BLOCK_DB="/Users/holocron/Library/Application Support/Nolocron-beta/config/database/block.db"

# Observability database
OBSERVABILITY_DB="/Users/holocron/_Local/Repos/nolocron-agent-orchestrator/data/observability.db"
```

## Required Verification Steps

### 1. Before Making Changes

Always check the current state:

```bash
# Get baseline counts
sqlite3 "$BLOCK_DB" "SELECT COUNT(*) as total_blocks FROM block;"
sqlite3 "$BLOCK_DB" "SELECT MAX(_id) as latest_id FROM block;"

# For specific conversation
sqlite3 "$BLOCK_DB" "SELECT _id FROM block WHERE sourceUid = 'conv_2_sH39GP1L' AND structureType = 1;"
```

### 2. After Running Tests

Verify expected changes occurred:

```bash
# Check for new blocks
sqlite3 "$BLOCK_DB" "SELECT _id, sourceUid, substr(content, 1, 100) FROM block WHERE _id > $PREVIOUS_MAX_ID;"

# Verify synthesis responses
sqlite3 "$BLOCK_DB" "SELECT * FROM block WHERE content LIKE '%synthesis%' OR content LIKE '%result is%' ORDER BY _id DESC LIMIT 5;"
```

### 3. Debugging Persistence Issues

When items aren't persisting, check:

```bash
# Find conversation container ID
sqlite3 "$BLOCK_DB" "SELECT _id, sourceUid FROM block WHERE sourceUid LIKE 'conv_%' AND structureType = 1;"

# Check blocks for that conversation
sqlite3 "$BLOCK_DB" "SELECT _id, sourceUid, datetime(ctime/1000, 'unixepoch') as created, substr(content, 1, 50) FROM block WHERE container = $CONVERSATION_ID ORDER BY _id DESC;"
```

## Verification Patterns

### Pattern 1: Confirm Persistence Success

```bash
# Step 1: Note current state
BEFORE_COUNT=$(sqlite3 "$BLOCK_DB" "SELECT COUNT(*) FROM block;")

# Step 2: Run operation
pnpm dev:command

# Step 3: Verify new entries
AFTER_COUNT=$(sqlite3 "$BLOCK_DB" "SELECT COUNT(*) FROM block;")
echo "New blocks created: $((AFTER_COUNT - BEFORE_COUNT))"

# Step 4: Examine new content
sqlite3 "$BLOCK_DB" "SELECT content FROM block ORDER BY _id DESC LIMIT $((AFTER_COUNT - BEFORE_COUNT));"
```

### Pattern 2: Track Specific Operations

```bash
# For synthesis verification
watch -n 1 'sqlite3 "$BLOCK_DB" "SELECT _id, substr(content, 1, 80) FROM block ORDER BY _id DESC LIMIT 5;"'
```

### Pattern 3: Conversation History Verification

```bash
# Get all blocks for a conversation
sqlite3 "$BLOCK_DB" "
SELECT 
  b._id,
  b.sourceUid,
  CASE 
    WHEN json_extract(b.metadata, '$.role') IS NOT NULL 
    THEN json_extract(b.metadata, '$.role')
    ELSE 'unknown'
  END as role,
  substr(b.content, 1, 50) as preview
FROM block b
WHERE b.container = (
  SELECT _id FROM block 
  WHERE sourceUid = '$CONVERSATION_ID' 
  AND structureType = 1
)
ORDER BY b._id;
"
```

## Critical Verification Points

### 1. Synthesis Persistence
- **What to verify**: New assistant responses after tool execution
- **Expected**: New block with synthesized content
- **Query**: Check for blocks with role='assistant' containing synthesis

### 2. Tool Result Storage  
- **What to verify**: Tool execution results are saved
- **Expected**: Blocks with tool_result type
- **Query**: Check metadata for tool information

### 3. Conversation Continuity
- **What to verify**: All messages in sequence
- **Expected**: User message → Model response → Tool calls → Tool results → Synthesis
- **Query**: Order by _id within conversation container

## Common Issues to Check

### Issue: "No new blocks after running command"
```bash
# Check if conversation exists
sqlite3 "$BLOCK_DB" "SELECT * FROM block WHERE sourceUid LIKE '%$CONVERSATION_ID%';"

# Check recent blocks regardless of conversation
sqlite3 "$BLOCK_DB" "SELECT _id, sourceUid, datetime(mtime/1000, 'unixepoch') FROM block ORDER BY mtime DESC LIMIT 10;"
```

### Issue: "Synthesis not found in database"
```bash
# Search for synthesis markers
sqlite3 "$BLOCK_DB" "SELECT _id, content FROM block WHERE content LIKE '%The result%' OR content LIKE '%equals%' OR content LIKE '%calculated%' ORDER BY _id DESC LIMIT 10;"
```

## Reporting Database State

When reporting issues, always include:

1. **Block counts before/after**
2. **Specific query results showing the issue**
3. **Conversation ID and container ID**
4. **Timestamp ranges of operations**

Example report:
```
Before test: 171 blocks
After test: 171 blocks (NO CHANGE)
Conversation: conv_2_sH39GP1L (container: 165)
Latest block in conversation: 171 (created: 2025-07-06 14:26:38)
Expected: Synthesis response containing "The result is 8"
Actual: No new blocks created
```

## Database Schema Reference

### Block Table Structure
```sql
-- Key columns for verification
_id INTEGER PRIMARY KEY      -- Unique identifier
sourceUid TEXT               -- Message/conversation ID  
content TEXT                 -- Actual message content
container INTEGER            -- Parent conversation _id
metadata TEXT                -- JSON with role, type, etc
ctime INTEGER               -- Creation timestamp (milliseconds)
mtime INTEGER               -- Modification timestamp
```

## Automation Helper

Create this bash function for quick verification:
```bash
verify_persistence() {
  local conv_id="${1:-conv_2_sH39GP1L}"
  local db_path="/Users/holocron/Library/Application Support/Nolocron-beta/config/database/block.db"
  
  echo "=== Conversation: $conv_id ==="
  
  # Get container ID
  local container=$(sqlite3 "$db_path" "SELECT _id FROM block WHERE sourceUid = '$conv_id' AND structureType = 1;")
  echo "Container ID: $container"
  
  # Count blocks
  local count=$(sqlite3 "$db_path" "SELECT COUNT(*) FROM block WHERE container = $container;")
  echo "Total blocks: $count"
  
  # Show recent blocks
  echo -e "\nRecent blocks:"
  sqlite3 "$db_path" "SELECT _id, substr(content, 1, 60) || '...' FROM block WHERE container = $container ORDER BY _id DESC LIMIT 5;"
}
```

## Remember

**Never assume persistence worked based on logs alone. Always verify in the database directly.**