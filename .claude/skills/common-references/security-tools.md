# Security Tools Reference

This document provides details on the security tools configured in this project via Trunk.

## Tools Overview

### Trivy

- **Purpose**: A comprehensive vulnerability and misconfiguration scanner for containers, infrastructure as code (IaC), and filesystems.
- **Usage in this project**: Scans the filesystem for vulnerabilities and hard-coded secrets.
- **Trunk Command**: `trunk check --filter trivy`

### OSV-Scanner

- **Purpose**: Google's vulnerability scanner for open-source dependencies, matching against the [Open Source Vulnerability (OSV) database](https://osv.dev/).
- **Usage in this project**: Identifies vulnerabilities in project dependencies (pnpm-lock.yaml, etc.).
- **Trunk Command**: `trunk check --filter osv-scanner`

## Interpreting Results

Findings are reported via the Trunk CLI with the following information:

- **Severity**: Low, Medium, High, or Critical.
- **Tool**: The name of the scanner that found the issue.
- **Message**: A description of the vulnerability and its impact.
- **Location**: The file and line number (or dependency name) where the issue was found.

## Remediation

- **Dependency issues**: Update the vulnerable package to a fixed version using `pnpm update`.
- **Code/Config issues**: Follow the recommendation provided in the Trunk output to fix misconfigurations or remove secrets.
