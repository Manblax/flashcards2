#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-${PROJECT_ROOT}/.env.production}"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.production.yml"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Production environment file not found: ${ENV_FILE}" >&2
  exit 1
fi

compose=(
  docker compose
  --env-file "${ENV_FILE}"
  -f "${COMPOSE_FILE}"
)

compose_environment="$("${compose[@]}" config --environment)"

compose_value() {
  local variable_name="$1"

  printf '%s\n' "${compose_environment}" |
    sed -n "s/^${variable_name}=//p" |
    tail -n 1
}

for variable_name in FRONTEND_HOST API_HOST LETSENCRYPT_EMAIL; do
  variable_value="$(compose_value "${variable_name}")"
  if [[ -z "${variable_value}" ]]; then
    echo "Required TLS variable is empty: ${variable_name}" >&2
    exit 1
  fi
  printf -v "${variable_name}" '%s' "${variable_value}"
done

for domain_name in "${FRONTEND_HOST}" "${API_HOST}"; do
  if (( ${#domain_name} > 253 )) ||
    [[ ! "${domain_name}" =~ ^([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$ ]]; then
    echo "Invalid DNS name: ${domain_name}" >&2
    exit 1
  fi

  if ! getent ahosts "${domain_name}" >/dev/null 2>&1; then
    echo "DNS does not resolve for ${domain_name}." >&2
    exit 1
  fi
done

if [[ "${FRONTEND_HOST}" == "${API_HOST}" ]]; then
  echo "FRONTEND_HOST and API_HOST must be different." >&2
  exit 1
fi

if [[ ! "${LETSENCRYPT_EMAIL}" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]; then
  echo "LETSENCRYPT_EMAIL must contain a valid email address." >&2
  exit 1
fi

"${compose[@]}" config --quiet
"${PROJECT_ROOT}/scripts/deploy-production.sh" "${ENV_FILE}" --validate-only

if "${compose[@]}" ps --status running --services | grep -qx nginx; then
  echo "Nginx is already running. This bootstrap command is only for initial certificate issuance." >&2
  exit 1
fi

"${compose[@]}" --profile tls-init pull certbot-init
"${compose[@]}" --profile tls-init run --rm --service-ports certbot-init
"${PROJECT_ROOT}/scripts/deploy-production.sh" "${ENV_FILE}"
