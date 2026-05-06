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

Option B (Beanstalk/RDS style vars):
- `RDS_DB_NAME`
- `RDS_USERNAME`
- `RDS_PASSWORD`
- `RDS_HOSTNAME`
- `RDS_PORT`

Deploy:

```bash
eb deploy
```

Get API URL:

```bash
eb status
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
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (if used)
- `NEXT_PUBLIC_GOOGLE_CALENDAR_EMBED_URL` (if used)

Deploy from Vercel dashboard (or `vercel --prod` from `web`).

## 4) DNS and HTTPS

- Point frontend DNS to Vercel (recommended for app UI domain).
- Point API DNS to Beanstalk ALB (via Route 53 CNAME/alias).
- Add TLS certs using AWS ACM for API domain and enable HTTPS on ALB listener.

## 5) Recommended production checklist

- Keep `DJANGO_DEBUG=0`.
- Use a strong `DJANGO_SECRET_KEY`.
- Restrict `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` to real domains only.
- Snapshot/backup RDS.
- Enable CloudWatch alarms for ALB/EC2/RDS health.
