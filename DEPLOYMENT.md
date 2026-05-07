# EventMaster deployment (Vercel + Elastic Beanstalk + RDS)

This setup deploys:
- `web` (Next.js) to **Vercel**
- `api` (Django) to **AWS Elastic Beanstalk** (load-balanced environment)
- PostgreSQL to **AWS RDS**

## 1) Create PostgreSQL on RDS

1. Create an RDS PostgreSQL instance (or Aurora PostgreSQL).
2. Put it in private subnets and allow inbound from your Beanstalk EC2 security group on port `5432`.
3. Save:
   - endpoint hostname
   - database name
   - username
   - password
   - port

## 2) Deploy Django API to Elastic Beanstalk (load balanced)

From the `api` directory:

```bash
eb init
eb create eventmaster-api-prod --elb-type application
```

Set environment variables in Beanstalk (Console -> Configuration -> Software):

- `DJANGO_SECRET_KEY` = long random secret
- `DJANGO_DEBUG` = `0`
- `ALLOWED_HOSTS` = your API domain(s), comma-separated
- `CORS_ALLOWED_ORIGINS` = frontend URL(s), comma-separated
- `CSRF_TRUSTED_ORIGINS` = frontend URL(s), comma-separated (must include `https://`)

For database credentials, set either group:

Option A (project-native vars):
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
Deploy:

```bash
eb deploy
```

Get API URL:

```bash
eb status
```

Seed db

```powershell
eb ssh --command 'cd /var/app/current; export POSTGRES_DB=$(/opt/elasticbeanstalk/bin/get-config environment -k POSTGRES_DB); export POSTGRES_USER=$(/opt/elasticbeanstalk/bin/get-config environment -k POSTGRES_USER); export POSTGRES_PASSWORD=$(/opt/elasticbeanstalk/bin/get-config environment -k POSTGRES_PASSWORD); export POSTGRES_HOST=$(/opt/elasticbeanstalk/bin/get-config environment -k POSTGRES_HOST); export POSTGRES_PORT=$(/opt/elasticbeanstalk/bin/get-config environment -k POSTGRES_PORT); /var/app/venv/*/bin/python manage.py migrate --noinput; /var/app/venv/*/bin/python manage.py seed --password password123'
```

reset + reseed db
```powershell
eb ssh --command 'cd /var/app/current; export POSTGRES_DB=$(/opt/elasticbeanstalk/bin/get-config environment -k POSTGRES_DB); export POSTGRES_USER=$(/opt/elasticbeanstalk/bin/get-config environment -k POSTGRES_USER); export POSTGRES_PASSWORD=$(/opt/elasticbeanstalk/bin/get-config environment -k POSTGRES_PASSWORD); export POSTGRES_HOST=$(/opt/elasticbeanstalk/bin/get-config environment -k POSTGRES_HOST); export POSTGRES_PORT=$(/opt/elasticbeanstalk/bin/get-config environment -k POSTGRES_PORT); /var/app/venv/*/bin/python manage.py migrate --noinput; /var/app/venv/*/bin/python manage.py seed --password password123'
```

Health check endpoints:
- `/api/health/`
- `/api/db_health/`

## 3) Deploy frontend to Vercel

Import the repo in Vercel and set:
- **Root Directory**: `web`
- **Framework Preset**: Next.js

Set Vercel environment variables:
- `NEXT_PUBLIC_API_BASE_URL` = `https://<your-beanstalk-domain>/api`


Deploy from Vercel dashboard (or `vercel --prod` from `web`).


- Keep `DJANGO_DEBUG=0`.
- Use a strong `DJANGO_SECRET_KEY`.
- Restrict `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` to real domains only.
