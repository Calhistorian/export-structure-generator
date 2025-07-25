# Generate System Status Report

Generate a comprehensive status report for ${args}.

## Analysis Requirements

**Think deeply and systematically** about the current state, analyzing:

1. **Current Status Assessment**
    - Overall system health and functionality
    - Component-level status and performance
    - Integration points and dependencies
    - Known issues and limitations

2. **Architecture Analysis**
    - Compliance with established patterns and principles
    - Component relationships and data flow
    - Scalability and maintainability considerations
    - Technical debt and improvement opportunities

3. **Operational Metrics**
    - Performance indicators and benchmarks
    - Error rates and failure patterns
    - Resource utilization and efficiency
    - Observability and monitoring coverage

4. **Risk Assessment**
    - Critical failure points and vulnerabilities
    - Dependency risks and external factors
    - Maintenance burden and complexity
    - Future compatibility concerns

## Report Structure

Create a markdown document in @docs/ with the filename: `${args}-status-report.md`

Include these sections:

### Executive Summary
- High-level status overview
- Key findings and recommendations
- Critical issues requiring immediate attention

### System Architecture Status

In mermaid
graph TB
    %% Component health status diagram

Component Analysis

- Individual component assessments
- Integration status matrix
- Performance metrics summary

Health Metrics Dashboard

pie title System Health Distribution
    %% Health breakdown visualization

Data Flow Analysis

flowchart LR
    %% Current data flow patterns

### Issues and Recommendations

- Prioritized issue list with severity ratings
- Actionable improvement recommendations
- Timeline and resource estimates

### Compliance Assessment

gantt
    title Compliance Status Timeline
    %% Compliance tracking visualization

### Quality Standards

- Comprehensive Analysis: Leave no stone unturned in your assessment
- Data-Driven Insights: Support conclusions with evidence from logs, metrics, and code analysis
- Actionable Recommendations: Provide specific, implementable improvement suggestions
- Visual Clarity: Use mermaid diagrams to communicate complex relationships and status efficiently
- Professional Presentation: Structure for both technical and executive audiences

Key Rule: Think systematically and comprehensively. This report should provide complete situational awareness of the system's current state and clear guidance for improvement.