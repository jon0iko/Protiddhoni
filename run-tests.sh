#!/bin/bash
# Test Runner Script for Protiddhoni Project
# Runs all unit tests and generates coverage reports

echo "=========================================="
echo "Protiddhoni - Test Suite Execution"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend Tests
echo -e "${YELLOW}[1/2] Running Backend Tests...${NC}"
echo "----------------------------------------"
cd backend

if npm test -- --coverage; then
    echo -e "${GREEN}✓ Backend tests passed${NC}"
else
    echo -e "${RED}✗ Backend tests failed${NC}"
    exit 1
fi

cd ..
echo ""

# Frontend Tests
echo -e "${YELLOW}[2/2] Running Frontend Tests...${NC}"
echo "----------------------------------------"
cd frontend/protiddhoni

if npm test -- --coverage; then
    echo -e "${GREEN}✓ Frontend tests passed${NC}"
else
    echo -e "${RED}✗ Frontend tests failed${NC}"
    exit 1
fi

cd ../..
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}All Tests Completed Successfully!${NC}"
echo "=========================================="
echo ""
echo "Coverage reports generated:"
echo "  - Backend: backend/coverage/"
echo "  - Frontend: frontend/protiddhoni/coverage/"
echo ""
