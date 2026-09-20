# Prometheus Bybit Gateway
Secure server-side gateway for PROMETHEUS APOCALIPSE.

Initial scope is read-only validation only. No order placement and no withdrawal endpoint.

Endpoints: `/health`, `/bybit/public-time`, `/bybit/account-status`.

Secrets must be supplied only as Railway environment variables: `BYBIT_API_KEY` and `BYBIT_API_SECRET`.
