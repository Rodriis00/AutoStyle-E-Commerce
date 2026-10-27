#!/bin/sh
# Respaldo diario (RNF-05). Cron: 0 3 * * * /opt/autostyle/deploy/backup.sh
set -e; mkdir -p /var/backups/autostyle
pg_dump "$DATABASE_URL" | gzip > /var/backups/autostyle/autostyle_$(date +%F).sql.gz
find /var/backups/autostyle -name '*.sql.gz' -mtime +14 -delete
