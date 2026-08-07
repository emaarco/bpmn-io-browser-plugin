# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately via GitHub's **Security Advisories** ("Report a vulnerability")
on this repository, with a description, reproduction steps, and impact. We aim to
acknowledge within 3 business days and to ship a fix or mitigation as quickly as
the severity warrants. Please give a reasonable window to address the issue
before any public disclosure.

## Scope

This is a client-side browser extension. It ships no remote code (all
dependencies, including bpmn-js, are bundled) and requests the minimum
permissions needed. Relevant concerns include: content-script injection,
permission escalation, and handling of untrusted `.bpmn` XML.
