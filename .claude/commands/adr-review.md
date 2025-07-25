# Review ADR Compliance

Before implementing any feature or architectural change, you must:

1. **Start with ADR Overview**: Review the @adrs/ directory to understand the system's established architectural decisions, design rationale, and implementation patterns that have been
formally accepted.

2. **Query Related ADRs**: When introducing novel solutions, search the @adrs/ directory for relevant decisions using keywords from your task (e.g., "context", "streaming", "pipeline",
"observability", "agent", "provider", "tool", "error").

3. **Compliance Check**: Ensure your implementation aligns with established ADR decisions:
    - Context-driven architecture (ADR-001, ADR-002)
    - Dynamic pipeline patterns (ADR-003, ADR-004)
    - Provider abstraction strategies (ADR-005, ADR-007, ADR-030)
    - Event-driven observability (ADR-008, ADR-009, ADR-019)
    - Streaming architecture (ADR-020, ADR-027, ADR-052)
    - Tool execution patterns (ADR-039, ADR-045, ADR-080)
    - Error handling strategies (ADR-055, ADR-056, ADR-057)

4. **Decision Rationale**: Always understand WHY existing architectural decisions were made before proposing alternatives. ADRs document the context, options considered, and reasoning behind
each choice.

**Key Rule**: No novel solution should be implemented without first searching for related ADRs that might already address the problem domain or establish constraints for your implementation
approach.

This refactored version maintains the same structure and intent as your original foundation-focused command but shifts the emphasis to ADRs, which document specific architectural decisions
and their rationale.