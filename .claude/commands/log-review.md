# Review Debug Logs

When debugging issues or investigating system behavior, you must systematically review available logs in order of diagnostic value:

1. **Start with Lifecycle Logs**: Review @logs/ directory for comprehensive system lifecycle events, execution flows, and high-level orchestration patterns that show the complete story of
system operations.

2. **Check Observability Reports**: Examine @evaluation-reports/ for structured observability data, performance metrics, and system health indicators that provide quantitative insights into
system behavior.

3. **Analyze LLM Response Reports**: Review @llm-responses/ for a record of final llm responses.

4. **Examine Domain Logs**: Investigate @logs/sandbox/ for component-specific file transport logs and domain-level debugging information that provide granular operational details.

5. **Correlation Analysis**: Cross-reference findings across log sources to:
    - Identify timing correlations between lifecycle events and domain operations
    - Match observability metrics with specific execution patterns
    - Connect LLM response anomalies to system-level behaviors
    - Trace issue propagation through different system layers

6. **Diagnostic Strategy**: Use logs to understand:
    - What happened (lifecycle events)
    - How well it performed (observability metrics)
    - What the AI decided (LLM responses)
    - Where components failed (domain logs)

**Key Rule**: Always start with the broadest scope (lifecycle logs) and progressively narrow to specific components (domain logs) to understand both the forest and the trees of any system
issue.

This command provides a structured approach to log analysis, emphasizing the diagnostic hierarchy you specified while maintaining the same format as your principle/ADR review commands.