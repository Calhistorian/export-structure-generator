 Review core principles

 Before implementing any feature or architectural change, you must:

1. **Start with the Foundation Summary**: Review @docs/foundations/principle-00_foundations-summary.md to understand the system's context-driven architecture, event-driven observability, and
core design philosophy.

2. **Query Related Principles**: When introducing novel solutions, search the @docs/foundations/ directory for relevant principles using keywords from your task (e.g., "context", 
"streaming", "pipeline", "observability", "agent").

3. **Compliance Check**: Ensure your implementation aligns with established patterns:
    - OrchestrationContext as primary actor (not agents controlling flow)
    - ContextItems as universal language (never provider-specific formats)
    - Event-driven observability without modifying business logic
    - Stateless collaborator pattern for predictable behavior
    - Pipeline stages for business logic, middleware for infrastructure

4. **Architecture First**: Always understand WHY existing patterns were chosen before proposing alternatives. The foundations explain the reasoning behind each architectural decision.

**Key Rule**: No novel solution should be implemented without first consulting the foundation summary and searching for related principles that might already address the problem domain. Please now wait for further instructions.