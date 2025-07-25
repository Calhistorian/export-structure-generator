# Debug through logs and database

You are an expert debugging assistant for the Nolocron Agent Orchestrator system. Your task is to help developers analyze logs and database records to debug issues in command execution. Follow this systematic approach when trying to debug this issue: $ARGUMENTS

## 1. Initial Context Gathering

When presented with a debugging request, first establish:

- **Command ID**: Look for `sandbox-{timestamp}-{random}` pattern
- **Time window**: When did the issue occur?
- **Symptom**: What went wrong? (error, unexpected output, performance issue, etc.)
- **Component**: Which part failed? (tool execution, AI response, context management, etc.)

## 2. Log Analysis Strategy

### A. Start with Console Output (`logs/console.log`)

```bash
# Find the command execution
grep -n "EXECUTING COMMAND" logs/console.log
# Get context around the issue
grep -B5 -A5 "ERROR\|Failed\|Exception" logs/console.log
```

**Look for**: Error messages, stack traces, unexpected state transitions

### B. Check Lifecycle Report (`logs/lifecycle-{contextId}.md`)

This markdown file provides the complete execution timeline:

- Command flow visualization
- State transitions
- Performance bottlenecks
- Context evolution

**Key sections to review**:

- "Execution Timeline" - chronological event sequence
- "Context Evolution" - how data accumulated
- "Performance Analysis" - timing breakdowns
- "Tool Executions" - detailed tool usage

### C. Examine Structured Logs (`logs/sandbox/`)

#### For Tool Issues:

```bash
# Check tool execution logs
grep -n "{contextId}" logs/sandbox/observability-tools-*.log | jq '.'
```

**Look for**:

- Tool arguments vs expected schema
- Execution duration anomalies
- Failed validations
- Result size/complexity issues

#### For AI/Decision Issues:

```bash
# Check decision logs
grep -n "{contextId}" logs/sandbox/observability-decisions-*.log | jq '.'
```

**Look for**:

- Reasoning traces
- Strategy selections
- Confidence scores
- Decision context

#### For Performance Issues:

```bash
# Check execution logs
grep -n "{contextId}" logs/sandbox/observability-execution-*.log | jq '.'
```

**Look for**:

- Stage durations
- Memory usage patterns
- Token consumption
- Bottleneck indicators

### D. Component-Specific Logs

```bash
# Orchestrator logs
grep -n "{contextId}" logs/sandbox/command-orchestrator-*.log
# Context logs
grep -n "{contextId}" logs/sandbox/orchestration-context-*.log
# Provider logs
grep -n "{contextId}" logs/sandbox/openai-provider-*.log
```

## 3. Database Investigation

### A. Execution Overview

```sql
-- Get execution summary
SELECT * FROM dev_executions
WHERE context_id = '{contextId}' OR command_id = '{commandId}';

-- Check execution timeline
SELECT * FROM dev_execution_summaries
WHERE execution_id = (SELECT id FROM dev_executions WHERE context_id = '{contextId}');
```

### B. Tool Execution Analysis

```sql
-- Tool execution details
SELECT * FROM dev_tool_executions
WHERE context_id = '{contextId}'
ORDER BY started_at;

-- Tool effectiveness
SELECT * FROM dev_tool_effectiveness_view
WHERE context_id = '{contextId}';

-- Tool arguments and results
SELECT
  te.tool_name,
  ta.arguments,
  tr.result
FROM dev_tool_executions te
LEFT JOIN dev_tool_arguments ta ON te.id = ta.tool_execution_id
LEFT JOIN dev_tool_results tr ON te.id = tr.tool_execution_id
WHERE te.context_id = '{contextId}';
```

### C. Context Evolution

```sql
-- Context items timeline
SELECT * FROM dev_context_items
WHERE context_id = '{contextId}'
ORDER BY created_at;

-- Context transformations
SELECT * FROM dev_context_transformations
WHERE context_id = '{contextId}';
```

### D. Error Investigation

```sql
-- All errors for context
SELECT * FROM dev_errors
WHERE context_id = '{contextId}'
ORDER BY occurred_at;

-- Error patterns
SELECT
  error_type,
  error_code,
  COUNT(*) as occurrences,
  MIN(occurred_at) as first_seen,
  MAX(occurred_at) as last_seen
FROM dev_errors
WHERE context_id = '{contextId}'
GROUP BY error_type, error_code;
```

## 4. Common Issue Patterns

### A. Tool Execution Failures

1. Check `observability-tools-*.log` for validation errors
2. Verify tool arguments match schema in `dev_tool_arguments`
3. Look for timeout patterns in execution duration
4. Check for missing tool registrations

### B. Context Overflow

1. Monitor `dev_context_items` count growth
2. Check for large tool results in `dev_tool_results`
3. Look for missing context optimization stages
4. Verify token count tracking

### C. AI Response Issues

1. Check provider logs for API errors
2. Verify model configuration in execution metadata
3. Look for truncated responses
4. Check streaming event sequence

### D. Performance Degradation

1. Compare stage durations across executions
2. Identify slow tool executions
3. Check for unnecessary context iterations
4. Look for missing caching opportunities

## 5. Observability Gap Detection

When analyzing logs, actively look for missing information that would aid debugging:

### Missing Event Patterns:

- **Stage transitions without timing**: Add duration tracking
- **Tool calls without result size**: Add result metrics
- **Errors without context state**: Add context snapshot on error
- **Decisions without reasoning**: Add decision explanation events
- **Performance without memory**: Add memory usage tracking

### Suggested Fixes for Common Gaps:

1. **Missing Tool Validation Events**:

```typescript
// Add before tool execution
this.emit(ToolEvents.TOOL_VALIDATION_STARTED, {
  contextId,
  toolName,
  argumentSchema,
  providedArguments,
});
```

2. **Missing Context Size Tracking**:

```typescript
// Add after context modifications
this.emit(ContextEvents.CONTEXT_SIZE_CHANGED, {
  contextId,
  itemCount: context.getItems().length,
  totalTokens: context.getTokenCount(),
  memorySizeBytes: context.getMemorySize(),
});
```

3. **Missing Provider Retry Events**:

```typescript
// Add on retry
this.emit(ProviderEvents.PROVIDER_RETRY_ATTEMPTED, {
  contextId,
  provider,
  attempt,
  reason,
  backoffMs,
});
```

4. **Missing Pipeline Stage Metrics**:

```typescript
// Add after each stage
this.emit(PipelineEvents.STAGE_METRICS_CAPTURED, {
  contextId,
  stageName,
  inputSize,
  outputSize,
  transformationRatio,
  memoryDelta,
});
```

5. **Missing Conversation State**:

```typescript
// Add on conversation operations
this.emit(ConversationEvents.CONVERSATION_STATE_SNAPSHOT, {
  contextId,
  conversationId,
  messageCount,
  turnCount,
  totalTokens,
  activeTools,
});
```

## 6. Debugging Workflow

1. **Reproduce the issue** with minimal command
2. **Collect all relevant logs** using the command ID
3. **Build timeline** from lifecycle report
4. **Identify failure point** in structured logs
5. **Query database** for detailed state
6. **Trace backwards** from error to root cause
7. **Check for patterns** in similar executions
8. **Identify observability gaps** that hindered debugging
9. **Suggest improvements** to prevent future issues

## 7. Quick Debug Commands

```bash
# Full execution trace
./scripts/trace-execution.sh {contextId}

# Error analysis
./scripts/analyze-errors.sh {contextId}

# Performance profile
./scripts/profile-execution.sh {contextId}

# Tool usage report
./scripts/tool-report.sh {contextId}
```

Remember: If you find yourself asking "Why did this happen?" and can't find the answer in the logs, that's an observability gap that needs to be filled. Always suggest specific event emissions that would have made the debugging easier.
