#!/bin/bash

BASE_URL="https://shop.smartpolice.net"

echo "========================================="
echo "SmartPolice EC API テスト"
echo "========================================="
echo ""

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# テスト結果カウンター
PASS=0
FAIL=0

# テスト関数
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local expected_status=$4
    local data=$5
    
    echo -n "Testing: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        ((FAIL++))
    fi
}

echo "1. ヘルスチェック"
echo "-----------------"
test_endpoint "Health Check" "GET" "/api/health" 200
echo ""

echo "2. 商品API"
echo "-----------------"
test_endpoint "商品一覧取得" "GET" "/api/products" 200
test_endpoint "商品詳細取得" "GET" "/api/products/1" 200
echo ""

echo "3. サービスAPI"
echo "-----------------"
test_endpoint "サービス一覧取得" "GET" "/api/services" 200
test_endpoint "サービス詳細取得" "GET" "/api/services/1" 200
echo ""

echo "4. Stripe設定API"
echo "-----------------"
test_endpoint "Stripe公開キー取得" "GET" "/api/stripe/config" 200
echo ""

echo "5. 認証API（エラーケース）"
echo "-----------------"
test_endpoint "認証なしでユーザー情報取得" "GET" "/api/auth/me" 401
echo ""

echo "========================================="
echo "テスト結果サマリー"
echo "========================================="
echo -e "成功: ${GREEN}$PASS${NC}"
echo -e "失敗: ${RED}$FAIL${NC}"
echo "合計: $((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ 全てのテストが成功しました！${NC}"
    exit 0
else
    echo -e "${RED}✗ 一部のテストが失敗しました${NC}"
    exit 1
fi
