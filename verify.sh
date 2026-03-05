#!/bin/bash

# APS Web UI 验证脚本
# 用于验证后端 API 连接和基本功能

echo "================================"
echo "APS Web UI 验证脚本"
echo "================================"
echo ""

BASE_URL="http://127.0.0.1:8000"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
TOTAL=0
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local path=$3
    local expected=$4
    
    TOTAL=$((TOTAL + 1))
    echo -n "测试 $TOTAL: $name ... "
    
    response=$(curl -s -X $method "$BASE_URL$path" -w "\n%{http_code}")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected" ]; then
        echo -e "${GREEN}✓ 通过${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ 失败${NC} (期望 $expected, 实际 $http_code)"
        FAILED=$((FAILED + 1))
    fi
}

echo "1. 检查后端服务..."
echo "-----------------------------------"

# 健康检查
test_api "健康检查" "GET" "/health" "200"

# 就绪检查
test_api "就绪检查" "GET" "/ready" "200"

# UI 端点
test_api "UI 端点列表" "GET" "/ui/endpoints" "200"

# UI 规范
test_api "UI 规范" "GET" "/ui/spec" "200"

echo ""
echo "2. 检查认证端点..."
echo "-----------------------------------"

# 注册端点（期望 415 因为没有 Content-Type）
test_api "注册端点" "POST" "/auth/register" "415"

# 登录端点（期望 415 因为没有 Content-Type）
test_api "登录端点" "POST" "/auth/login" "415"

echo ""
echo "3. 检查其他端点（需要认证）..."
echo "-----------------------------------"

# 工作空间列表（期望 401 因为没有 token）
test_api "工作空间列表" "GET" "/workspaces?page=1&page_size=20" "401"

# 任务列表（期望 401 因为没有 token）
test_api "任务列表" "GET" "/tasks?workspace_id=00000000-0000-0000-0000-000000000000" "401"

# 智能体列表（期望 401 因为没有 token）
test_api "智能体列表" "GET" "/agents" "401"

# 工作流列表（期望 401 因为没有 token）
test_api "工作流列表" "GET" "/workflows" "401"

echo ""
echo "================================"
echo "测试结果汇总"
echo "================================"
echo -e "总计: $TOTAL"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！后端 API 运行正常。${NC}"
    echo ""
    echo "下一步："
    echo "1. 启动前端: cd ~/Desktop/aps-web-ui && npm run dev"
    echo "2. 访问: http://localhost:5173"
    echo "3. 注册账号并开始使用"
    exit 0
else
    echo -e "${RED}✗ 有 $FAILED 个测试失败。${NC}"
    echo ""
    echo "故障排除："
    echo "1. 确认后端服务运行: ps aux | grep agent-parallel-system"
    echo "2. 检查端口占用: lsof -i :8000"
    echo "3. 查看后端日志"
    exit 1
fi
