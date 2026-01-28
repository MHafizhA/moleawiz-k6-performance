# ============================================
# K6 Performance Test Runner
# File: run-tests.sh
# ============================================

echo "================================================"
echo "K6 Performance Test Suite"
echo "Application: Moleawiz & LBS Staging"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create results directory
mkdir -p results
mkdir -p reports

# Function to run test and show results
run_test() {
    local test_name=$1
    local test_file=$2
    local description=$3

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Running: ${test_name}${NC}"
    echo -e "${YELLOW}Description: ${description}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    k6 run $test_file

    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ Test completed successfully${NC}"
    else
        echo -e "${RED}✗ Test failed with exit code: $exit_code${NC}"
    fi
    echo ""
    echo ""
}

# Main menu
show_menu() {
    echo "Select test to run:"
    echo "1) Smoke Test (Quick health check - 2 minutes)"
    echo "2) Load Test (Normal traffic simulation - 19 minutes)"
    echo "3) Stress Test (Find breaking point - 21 minutes)"
    echo "4) Spike Test (Sudden traffic surge - 8 minutes)"
    echo "5) Scenario Test (Complete user journey - 5 minutes)"
    echo "6) Comprehensive Test (All features - 14 minutes)"
    echo "7) Run All Tests (Sequential execution)"
    echo "8) Exit"
    echo ""
    read -p "Enter your choice [1-8]: " choice
}

# Test execution
case_execution() {
    case $choice in
        1)
            run_test "Smoke Test" "smoke-test.js" "Basic health check with minimal load"
            ;;
        2)
            run_test "Load Test" "load-test.js" "Simulates normal production traffic"
            ;;
        3)
            run_test "Stress Test" "stress-test.js" "Pushes system to find breaking point"
            ;;
        4)
            run_test "Spike Test" "spike-test.js" "Tests system behavior under sudden load spike"
            ;;
        5)
            run_test "Scenario Test" "scenario-test.js" "Complete user journey scenarios"
            ;;
        6)
            run_test "Comprehensive Test" "comprehensive-test.js" "Full feature testing with detailed metrics"
            ;;
        7)
            echo -e "${YELLOW}Running all tests sequentially...${NC}"
            echo -e "${YELLOW}Total estimated time: ~70 minutes${NC}"
            echo ""
            read -p "Continue? (y/n): " confirm
            if [ "$confirm" = "y" ]; then
                run_test "1. Smoke Test" "smoke-test.js" "Health check"
                run_test "2. Load Test" "load-test.js" "Normal traffic"
                run_test "3. Stress Test" "stress-test.js" "Breaking point"
                run_test "4. Spike Test" "spike-test.js" "Traffic spike"
                run_test "5. Scenario Test" "scenario-test.js" "User journey"
                run_test "6. Comprehensive Test" "comprehensive-test.js" "Full testing"

                echo -e "${GREEN}================================================${NC}"
                echo -e "${GREEN}All tests completed!${NC}"
                echo -e "${GREEN}Check the 'reports' directory for HTML reports${NC}"
                echo -e "${GREEN}================================================${NC}"
            fi
            ;;
        8)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Please try again.${NC}"
            ;;
    esac
}

# Main execution loop
while true; do
    show_menu
    case_execution
    echo ""
    read -p "Press Enter to continue..."
    clear
done
