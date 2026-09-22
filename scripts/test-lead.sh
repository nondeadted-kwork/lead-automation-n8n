#!/usr/bin/env bash
# Отправляет тестовые заявки на вебхук. Использование:
#   ./scripts/test-lead.sh https://n8n.example.com/webhook/lead [ok|bad|bot|flood|garbage]
set -euo pipefail
URL=${1:?"Укажите URL вебхука"}
MODE=${2:-ok}

post() {
  curl -sS -w '  → HTTP %{http_code}, %{time_total}s\n' -X POST "$URL" -H 'Content-Type: application/json' -d "$1"
}

case "$MODE" in
  ok)      post '{"name":"Тест Тестов","phone":"8 900 123-45-67","email":"","service":"Ремонт под ключ","comment":"Проверка связки","consent":true,"source":"test-lead.sh"}' ;;
  bad)     post '{"name":"Т","phone":"123","email":"not-an-email","consent":false}' ;;
  bot)     post '{"name":"Spam","phone":"+79990000000","consent":true,"website":"http://spam.example"}' ;;
  garbage) post '{"name":[1,2,{"x":null}],"phone":{"a":1},"consent":"on"}' ;;
  flood)   for i in 1 2 3 4 5 6 7; do post '{"name":"Флуд","phone":"89001112233","consent":true}'; done ;;
  *) echo "Режимы: ok | bad | bot | garbage | flood"; exit 1 ;;
esac
