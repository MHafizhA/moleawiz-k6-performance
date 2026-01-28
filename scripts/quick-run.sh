# ============================================
# Quick Run Commands
# File: quick-run.sh
# ============================================

#!/bin/bash

# Quick smoke test
alias k6-smoke='k6 run smoke-test.js'

# Quick load test
alias k6-load='k6 run load-test.js'

# Quick stress test
alias k6-stress='k6 run stress-test.js'

# Run with JSON output
alias k6-load-json='k6 run --out json=results/load-test-$(date +%Y%m%d-%H%M%S).json load-test.js'

# Run with verbose output
alias k6-load-verbose='k6 run --verbose load-test.js'

# Run comprehensive test
alias k6-comprehensive='k6 run comprehensive-test.js'
