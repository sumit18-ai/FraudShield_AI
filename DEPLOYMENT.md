# FraudShield AI — Public Hosting & Deployment Guide

This guide provides step-by-step instructions for deploying **FraudShield AI** to production and making it publicly accessible to the world.

---

## Architecture Overview

```
[ Public Users & Evaluators ]
           │
           ▼ (HTTPS)
   [ Vercel Edge CDN ] ────► Frontend (React + Vite SPA)
           │
           ▼ (REST API + JWT Bearer / X-API-KEY)
   [ Render / Railway ] ───► Backend (FastAPI + Stacking Ensemble ML + SHAP)
```

---

## Option 1: 100% Free Global Deployment (Recommended)

This setup provides high global performance, 0ms frontend cold starts, and zero hosting costs.

### Step 1: Deploy Backend to Render (Free Web Service)
1. Push your code to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** $\to$ **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name**: `fraudshield-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `PORT`: `8008`
   - `ALLOWED_ORIGINS`: `*` (or your Vercel URL once created)
   - `JWT_SECRET_KEY`: `your-random-cryptographic-secret-32-chars`
6. Click **Create Web Service**.
7. Render will build the Docker container and provide a public URL (e.g., `https://fraudshield-backend.onrender.com`). Verify that `https://fraudshield-backend.onrender.com/health` returns `{"status":"online"}`.

> [!NOTE]
> Free-tier instances on Render spin down after 15 minutes of inactivity. When a visitor opens the app, the first request takes ~30–50 seconds while the instance boots. FraudShield includes an automatic health checker and on-device risk fallback to provide uninterrupted UX while the cloud backend wakes up.

---

### Step 2: Deploy Frontend (Vercel OR GitHub Pages)

#### Option 2A: Vercel (Fastest & Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New...** $\to$ **Project**.
2. Select your GitHub repository.
3. In **Build & Development Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://fraudshield-backend.onrender.com` *(Replace with your actual Render backend URL)*
5. Click **Deploy**.

#### Option 2B: GitHub Pages (Automated via GitHub Actions)
The repository includes a ready-to-use GitHub Actions workflow [`.github/workflows/deploy-gh-pages.yml`](.github/workflows/deploy-gh-pages.yml):
1. In your GitHub repository, navigate to **Settings** $\to$ **Pages** (under Code and automation).
2. Under **Build and deployment** $\to$ **Source**, select **GitHub Actions**.
3. Under **Settings** $\to$ **Secrets and variables** $\to$ **Actions**, optionally add a secret:
   - Name: `VITE_API_URL`
   - Value: `https://fraudshield-backend.onrender.com`
4. Push a commit or trigger the workflow manually in the **Actions** tab.
5. GitHub will build and host your frontend live at `https://<your-username>.github.io/FraudShield_AI/`.


---

## Option 2: Single-Server VPS (Docker Compose)

Ideal for dedicated cloud virtual machines (AWS EC2, DigitalOcean Droplet, Hetzner, Linode).

### Prerequisites
- Ubuntu 22.04 / 24.04 LTS server
- Docker and Docker Compose installed
- A custom domain pointing to your server IP (e.g., `fraud.yourdomain.com`)

### 1. Clone & Configure
```bash
git clone https://github.com/your-username/FraudShield_AI.git
cd FraudShield_AI
```

### 2. Launch Services
```bash
docker-compose up -d --build
```
- Frontend will be live on `http://YOUR_SERVER_IP:3000` (served by Nginx).
- Backend will be live on `http://YOUR_SERVER_IP:8008` (served by Uvicorn).

### 3. Setup SSL with Caddy or Nginx Certbot (Recommended)
To serve on port 80/443 with automatic HTTPS, run Caddy as a reverse proxy:
```Caddyfile
fraud.yourdomain.com {
    reverse_proxy localhost:3000
}

api.fraud.yourdomain.com {
    reverse_proxy localhost:8008
}
```

---

## Option 3: One-Click Render Blueprint

FraudShield includes a root [render.yaml](file:///c:/Users/Sumit/OneDrive/Desktop/FraudShield_AI/FraudShield_AI/render.yaml) file:
1. In Render Dashboard, click **New +** $\to$ **Blueprint**.
2. Select your repository.
3. Render reads `render.yaml` and deploys both backend and frontend static site automatically.

---

## Enterprise Authentication & RBAC Reference

FraudShield includes pre-seeded enterprise personas for immediate testing without registration:

| Persona Role | Pre-configured Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **SOC Analyst** | `analyst@fraudshield.ai` | `analyst123` | Live transactions, risk scoring, graph intelligence, manual review. |
| **Compliance Officer** | `compliance@fraudshield.ai` | `compliance123` | SHAP reason codes, FCRA compliance cards, drift reports, model benchmarks. |
| **Lead Admin / CISO** | `admin@fraudshield.ai` | `admin123` | Full access: Federated Learning weight updates, synthetic drift spikes, API key issuance. |

Public visitors can also:
- Click **"1-Click Demo Personas"** in the Identity Portal to instantly switch roles without typing passwords.
- Click **"Create Account"** to register a new user profile with their own custom department and role.

---

## Programmatic Banking API Key Access

External core banking systems, payment processors, and webhooks can send transactions directly to `/analyze` using the `X-API-KEY` header without an interactive web session:

```bash
curl -X POST "https://your-backend.onrender.com/analyze?domain=paysim" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: fs_live_banking_partner_key_889" \
  -d '{
    "step": 1,
    "type": "TRANSFER",
    "amount": 250000.00,
    "nameOrig": "C19283746",
    "oldbalanceOrg": 250000.00,
    "newbalanceOrig": 0.00,
    "nameDest": "M98765432",
    "oldbalanceDest": 0.00,
    "newbalanceDest": 0.00
  }'
```

---

## Anti-Abuse & Production Security Features Active

- **Sliding-Window Rate Limiting**: 120 requests/minute per IP on `/analyze` and 30 req/min on `/auth`. Prevents DDoS and resource exhaustion.
- **OWASP Security Headers**: Automatic `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and strict `Referrer-Policy`.
- **Immutable Security Audit Trail**: Logs critical actions (fraud blocks, threshold changes, federated aggregations) with timestamp, actor, role, and IP address.
