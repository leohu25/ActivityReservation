#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

node "${WORKSPACE_ROOT}/.harness/lifecycle/session-end.mjs"
