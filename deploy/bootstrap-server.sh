#!/usr/bin/env bash
# One-time server preparation, run as a sudo-capable user:
#   bash deploy/bootstrap-server.sh
#
# Written for the existing VPS, which already hosts other sites: Docker and
# nginx were present, so this only fills the gaps. It deliberately does NOT
# touch nginx, enable a firewall, or stop anything -- on a shared box those
# are decisions to make deliberately, not as a side effect of bootstrapping.
set -euo pipefail

echo "==> Docker"
if command -v docker >/dev/null 2>&1; then
  echo "    present: $(docker --version)"
else
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io
  sudo systemctl enable --now docker
fi

echo "==> Compose plugin"
if docker compose version >/dev/null 2>&1; then
  echo "    present: $(docker compose version)"
else
  # Ubuntu's packaged plugin, which coexists with the docker.io package.
  # Do not add Docker's upstream repo here; it conflicts with docker.io.
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker-compose-v2
fi

echo "==> Docker group membership for $USER"
if id -nG "$USER" | tr ' ' '\n' | grep -qx docker; then
  echo "    already a member"
else
  sudo usermod -aG docker "$USER"
  echo "    added -- reconnect for it to take effect"
fi

echo "==> certbot"
command -v certbot >/dev/null 2>&1 \
  && echo "    present: $(certbot --version 2>&1)" \
  || sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq certbot python3-certbot-nginx

cat <<'NOTE'

==> Bootstrap complete. Remaining steps are deliberate, not automated:

    1. Create .env      cp .env.production.example .env  (generate real secrets)
    2. Deploy           bash deploy/deploy.sh
    3. nginx vhost      sudo cp deploy/nginx-micromachines.conf \
                          /etc/nginx/sites-available/micromachines.conf
                        sudo ln -s /etc/nginx/sites-available/micromachines.conf \
                          /etc/nginx/sites-enabled/
                        sudo nginx -t && sudo systemctl reload nginx
    4. TLS              sudo certbot --nginx -d <domain> -d www.<domain> --redirect

    A firewall is NOT configured by this script. The stack publishes only
    127.0.0.1:8080; Postgres, Redis, Meilisearch and the backend are reachable
    only on the internal Docker network.
NOTE
