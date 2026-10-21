# 🌷 Flower Shop — a beginner DevOps project

A small online flower shop used to learn DevOps step by step:

**code → tests → Docker → GitHub (branches + Pull Requests) → CI (tests, Trivy, SonarQube) → CD (push images to Amazon ECR)**

The README follows the order of the lesson. Read it from top to bottom.

> CI/CD runs **automatically in GitHub Actions**. You never run the pipeline by hand
> in an AWS terminal. You only push code and open Pull Requests.

---

## Lesson plan

1. [The application](#1-the-application)
2. [Project structure](#2-project-structure)
3. [Run the app locally (without Docker)](#3-run-the-app-locally-without-docker)
4. [Run the tests](#4-run-the-tests)
5. [Docker: build images](#5-docker-build-images)
6. [Docker Compose: run everything together](#6-docker-compose-run-everything-together)
7. [GitHub: feature branches and Pull Requests](#7-github-feature-branches-and-pull-requests)
8. [CI workflow (`ci.yml`)](#8-ci-workflow-ciyml)
9. [SonarQube setup and connectivity](#9-sonarqube-setup-and-connectivity)
10. [AWS setup: OIDC and ECR](#10-aws-setup-oidc-and-ecr)
11. [CD workflow (`cd.yml`)](#11-cd-workflow-cdyml)
12. [GitHub secrets and variables](#12-github-secrets-and-variables)
13. [Command cheat sheet (English + Russian)](#13-command-cheat-sheet-english--russian)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. The application

| Part | Technology | Port | What it does |
| --- | --- | --- | --- |
| `backend/` | Node.js + Express | **3000** | REST API with the flower catalog |
| `frontend/` | React + Vite | **5173** | Flower catalog page and shopping cart |

Backend endpoints:

| URL | Answer |
| --- | --- |
| `GET /health` | `{"status":"ok"}`, used by Docker to check the API is alive |
| `GET /api/flowers` | List of all flowers |
| `GET /api/flowers/:id` | One flower, or `404` |

**How the frontend talks to the backend:** the React code always calls the relative URL `/api/flowers`.

- In development, the **Vite dev server** forwards `/api` to `http://localhost:3000` (see `frontend/vite.config.js`).
- In Docker, **nginx** inside the frontend container forwards `/api` to `http://backend:3000` (see `frontend/nginx.conf`).

The browser only ever talks to port 5173, so there are no CORS problems.

---

## 2. Project structure

```
flower-shop/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # CI: runs on every Pull Request to main
│   │   └── cd.yml                 # CD: runs on every push (merge) to main
│   └── pull_request_template.md   # Checklist shown when you open a PR
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app: /health and /api/flowers routes
│   │   ├── flowers.js             # Flower catalog data
│   │   └── server.js              # Starts the server on port 3000
│   ├── tests/
│   │   └── app.test.js            # API tests (Node.js built-in test runner)
│   ├── Dockerfile                 # Backend image
│   ├── .dockerignore              # Files Docker must not copy into the image
│   ├── package.json               # Scripts and dependencies
│   └── package-lock.json          # Exact dependency versions
├── frontend/
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Cart.jsx           # Shopping cart
│   │   │   └── FlowerCard.jsx     # One flower in the catalog
│   │   ├── App.jsx                # Main page: loads flowers, keeps the cart
│   │   ├── App.test.jsx           # Page tests (Vitest + Testing Library)
│   │   ├── api.js                 # fetch('/api/flowers')
│   │   ├── cart.js                # Cart helper functions
│   │   ├── cart.test.js           # Cart tests
│   │   ├── main.jsx               # React entry point
│   │   ├── setupTests.js          # Test setup
│   │   └── styles.css
│   ├── index.html
│   ├── vite.config.js             # Port 5173, /api proxy, test settings
│   ├── nginx.conf                 # nginx config used inside the Docker image
│   ├── Dockerfile                 # Frontend image (build with Node, serve with nginx)
│   ├── .dockerignore
│   ├── package.json
│   └── package-lock.json
├── docker-compose.yml             # Runs backend + frontend together
├── sonar-project.properties       # SonarQube project settings
├── .gitignore                     # Files Git must not commit
└── README.md
```

---

## 3. Run the app locally (without Docker)

You need **Node.js 22** (`node -v`).

Terminal 1, backend:

```bash
cd backend
npm ci          # install dependencies from package-lock.json
npm start       # start the API on http://localhost:3000
```

Terminal 2, frontend:

```bash
cd frontend
npm ci
npm run dev     # start Vite on http://localhost:5173
```

Open <http://localhost:5173>. Check the API directly:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/flowers
```

---

## 4. Run the tests

```bash
cd backend  && npm test     # 5 API tests
cd frontend && npm test     # 8 cart and page tests
```

With a coverage report (written to `coverage/lcov.info`, which SonarQube reads):

```bash
npm run test:coverage
```

Build the production frontend (output goes to `frontend/dist/`):

```bash
cd frontend && npm run build
```

---

## 5. Docker: build images

Each part has its own `Dockerfile`:

- **backend/Dockerfile** uses `node:22-alpine`, installs only production dependencies, runs as the
  non-root `node` user and has a `HEALTHCHECK` on `/health`. It also deletes npm, which the app does not
  need at runtime, so Trivy does not report npm's own vulnerabilities.
- **frontend/Dockerfile** is a *multi-stage* build. Stage 1 runs `npm run build` with Node.js.
  Stage 2 copies only the `dist/` files into a small non-root nginx image that listens on port 5173.

`.dockerignore` keeps `node_modules`, `coverage` and other local files out of the images.

```bash
docker build -t flower-shop-backend  ./backend
docker build -t flower-shop-frontend ./frontend
docker images | grep flower-shop
```

---

## 6. Docker Compose: run everything together

```bash
docker compose up --build -d     # build the images and start both containers
docker compose ps                # backend should show "(healthy)"
docker compose logs -f           # follow the logs (Ctrl+C to stop following)
docker compose down              # stop and remove the containers
```

Open <http://localhost:5173>. The frontend starts only after the backend is healthy (`depends_on` +
`condition: service_healthy`).

---

## 7. GitHub: feature branches and Pull Requests

This folder is meant to be its **own GitHub repository** called `flower-shop`, so that
`.github/workflows/` is at the root of the repository. GitHub only runs workflows from there.

### First upload (one time)

Create an **empty** repository `flower-shop` on GitHub (no README, no .gitignore), then:

```bash
cd flower-shop
git init -b main
git add .
git commit -m "Initial commit: Flower Shop app with CI/CD"
git remote add origin https://github.com/<YOUR_USER>/flower-shop.git
git push -u origin main
```

### Daily workflow: feature branch → Pull Request → main

Never commit directly to `main`. Every change goes through a Pull Request so that CI checks it first.

```bash
git checkout main
git pull                                   # get the latest main
git checkout -b feature/add-orchid         # create a feature branch
# ... edit code ...
git add .
git commit -m "Add orchid to the catalog"
git push -u origin feature/add-orchid      # upload the branch
```

Then on GitHub: **Compare & pull request → base: `main` ← compare: `feature/add-orchid` → Create pull request.**

1. **CI starts automatically** on the Pull Request (`ci.yml`).
2. If CI is green, click **Merge pull request**.
3. The merge is a push to `main`, so **CD starts automatically** (`cd.yml`).

### Recommended: protect `main`

GitHub → **Settings → Branches → Add branch ruleset** (or *Branch protection rule*) for `main`:

- Require a pull request before merging
- Require status checks to pass, and select the **Test, build, scan** check from CI

---

## 8. CI workflow (`ci.yml`)

**Trigger:** `pull_request` to `main`. One job, steps run in this order:

| # | Step | What it does |
| --- | --- | --- |
| 1 | Checkout code | Downloads the repository onto the GitHub runner (full history for SonarQube) |
| 2 | Setup Node.js | Installs Node.js 22 and caches npm packages |
| 3 | Install dependencies | `npm ci` in `backend/` and `frontend/` |
| 4 | Run tests | Runs tests with coverage and fixes the file paths in the coverage reports for SonarQube |
| 5 | Build application | `npm run build` for the frontend |
| 6 | Build Docker images | Builds both images on the runner. Nothing is pushed |
| 7 | Scan Docker images with Trivy | 7a backend, 7b frontend. Fails on HIGH/CRITICAL vulnerabilities that have a fix |
| 8 | Run SonarQube analysis | Sends code and coverage to your SonarQube server |
| 9 | Check SonarQube Quality Gate | Waits for the result and fails if the Quality Gate is red |

If any step fails, later steps are skipped and the Pull Request shows a red ❌.

All third-party actions are pinned to a full commit SHA (with the version in a comment). This protects
the pipeline if someone moves a tag in an action's repository.

---

## 9. SonarQube setup and connectivity

CI steps 8 and 9 need a running SonarQube server (self-hosted SonarQube Server, or SonarQube Cloud).

### 9.1 Connectivity: GitHub must be able to reach SonarQube

The workflow runs on **GitHub-hosted runners**, which are machines on the public internet. The runner
connects to `SONAR_HOST_URL`, so:

- The URL must be reachable **from the internet**, e.g. `https://sonarqube.example.com` or
  `http://<public-ip>:9000`. `http://localhost:9000` or a private IP **will not work**.
- If SonarQube runs on a cloud VM, its firewall or Security Group must allow inbound traffic on the
  SonarQube port (9000 by default, or 443 behind HTTPS). Changing a firewall is your decision; this
  project does not change any infrastructure.
- If SonarQube is only reachable inside a private network, you would need a **self-hosted runner**
  inside that network. That is out of scope here.

Test from your laptop:

```bash
curl -s https://<your-sonarqube-host>/api/system/status
# expected: {"status":"UP", ...}
```

### 9.2 Create the project and token in SonarQube

1. SonarQube → **Create project → Manually**. Project key: **`flower-shop`** (must match
   `sonar.projectKey` in `sonar-project.properties`).
2. **My Account → Security → Generate token** (type *Project analysis token* for `flower-shop`). Copy it.
3. GitHub → repository **Settings → Secrets and variables → Actions → New repository secret**:
   - `SONAR_TOKEN` = the token
   - `SONAR_HOST_URL` = the server URL, e.g. `https://sonarqube.example.com` (no trailing slash)

> For SonarQube Cloud, also add `sonar.organization=<your-org>` to `sonar-project.properties`
> and use `https://sonarcloud.io` as `SONAR_HOST_URL`.

---

## 10. AWS setup: OIDC and ECR

CD pushes images to **Amazon ECR** and logs in to AWS with **OIDC**: GitHub gives the workflow a
short-lived identity token, and AWS exchanges it for temporary credentials of one IAM role.
**No AWS access keys are stored in GitHub.**

> ⚠️ This project **does not create or change any AWS resources**. The commands below are a
> reference for you (or your AWS admin) to run **once**, after reviewing them. If any of these
> resources already exist in your account, **reuse them** and do not recreate them.

Replace `<ACCOUNT_ID>`, `<REGION>` (e.g. `us-east-1`) and `<GITHUB_USER>`.

### 10.1 ECR repositories (one per image)

```bash
aws ecr create-repository --repository-name flower-shop-backend  --region <REGION>
aws ecr create-repository --repository-name flower-shop-frontend --region <REGION>
```

### 10.2 GitHub OIDC identity provider (once per AWS account)

Check first, because it may already exist:

```bash
aws iam list-open-id-connect-providers
```

If `token.actions.githubusercontent.com` is **not** in the list:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com
```

### 10.3 IAM role for GitHub Actions

`trust-policy.json` lets **only the `main` branch of your `flower-shop` repository** assume the role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:<GITHUB_USER>/flower-shop:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

`ecr-push-policy.json` allows pushing **only** to the two flower-shop repositories:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": [
        "arn:aws:ecr:<REGION>:<ACCOUNT_ID>:repository/flower-shop-backend",
        "arn:aws:ecr:<REGION>:<ACCOUNT_ID>:repository/flower-shop-frontend"
      ]
    }
  ]
}
```

```bash
aws iam create-role --role-name github-actions-flower-shop \
  --assume-role-policy-document file://trust-policy.json

aws iam put-role-policy --role-name github-actions-flower-shop \
  --policy-name ecr-push --policy-document file://ecr-push-policy.json
```

The role ARN is `arn:aws:iam::<ACCOUNT_ID>:role/github-actions-flower-shop`. Save it as a GitHub
secret (next sections).

---

## 11. CD workflow (`cd.yml`)

**Trigger:** `push` to `main`, which happens when a Pull Request is merged. One job:

| # | Step | What it does |
| --- | --- | --- |
| 1 | Checkout code | Downloads the repository |
| 2 | Configure AWS credentials with OIDC | Assumes the IAM role from `AWS_ROLE_ARN`. No keys |
| 3 | Login to Amazon ECR | Logs Docker in to `<ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com` |
| 4 | Build Docker images | Builds backend and frontend images |
| 5 | Tag Docker images using commit SHA | `…/flower-shop-backend:<commit-sha>` |
| 6 | Push Docker images to ECR | Uploads both images |
| 7 | Display image references in logs | Prints the full image names in the log and the run summary |

The workflow needs `permissions: id-token: write` so GitHub can issue the OIDC token.

**This project deploys nothing.** There is no EC2, EKS, Kubernetes, Helm or kubectl. CD ends when the
images are in ECR.

See the images:

```bash
aws ecr describe-images --repository-name flower-shop-backend --region <REGION>
```

---

## 12. GitHub secrets and variables

GitHub → repository **Settings → Secrets and variables → Actions**.

| Kind | Name | Example | Used by |
| --- | --- | --- | --- |
| Secret | `SONAR_TOKEN` | token from SonarQube | CI steps 8, 9 |
| Secret | `SONAR_HOST_URL` | `https://sonarqube.example.com` | CI steps 8, 9 |
| Secret | `AWS_ROLE_ARN` | `arn:aws:iam::<ACCOUNT_ID>:role/github-actions-flower-shop` | CD step 2 |
| Variable | `AWS_REGION` | `us-east-1` | CD |
| Variable | `ECR_BACKEND_REPOSITORY` | `flower-shop-backend` | CD |
| Variable | `ECR_FRONTEND_REPOSITORY` | `flower-shop-frontend` | CD |

**Secrets** are hidden in logs. **Variables** are plain settings. Never put passwords, tokens or keys
in code or in workflow files.

---

## 13. Command cheat sheet (English + Russian)

| Command | English | Русский |
| --- | --- | --- |
| `npm ci` | Install exact dependency versions from package-lock.json | Установить точные версии зависимостей из package-lock.json |
| `npm start` | Start the backend API | Запустить backend API |
| `npm run dev` | Start the Vite dev server | Запустить dev-сервер Vite |
| `npm test` | Run the tests | Запустить тесты |
| `npm run test:coverage` | Run tests and create a coverage report | Запустить тесты и создать отчёт о покрытии |
| `npm run build` | Build the production frontend | Собрать production-версию frontend |
| `docker build -t NAME ./backend` | Build a Docker image from a folder | Собрать Docker-образ из папки |
| `docker images` | List local images | Показать локальные образы |
| `docker compose up --build -d` | Build and start all containers in the background | Собрать и запустить все контейнеры в фоне |
| `docker compose ps` | Show container status | Показать статус контейнеров |
| `docker compose logs -f` | Follow container logs | Смотреть логи контейнеров в реальном времени |
| `docker compose down` | Stop and remove containers | Остановить и удалить контейнеры |
| `git checkout -b feature/x` | Create a new feature branch and switch to it | Создать новую feature-ветку и перейти в неё |
| `git add .` | Stage all changes | Добавить все изменения в индекс |
| `git commit -m "msg"` | Save a commit with a message | Сохранить коммит с сообщением |
| `git push -u origin feature/x` | Upload the branch to GitHub | Отправить ветку на GitHub |
| `git pull` | Download the latest changes | Скачать последние изменения |
| `curl http://localhost:3000/health` | Check that the API is alive | Проверить, что API работает |
| `aws ecr describe-images --repository-name flower-shop-backend` | List images in ECR | Показать образы в ECR |

Key terms:

| Term | English | Русский |
| --- | --- | --- |
| CI | Automatic checks on every Pull Request | Автоматические проверки для каждого Pull Request |
| CD | Automatic delivery of images after merge to main | Автоматическая доставка образов после слияния в main |
| Pull Request | Request to merge a branch into main | Запрос на слияние ветки в main |
| Trivy | Scans images for known vulnerabilities | Сканирует образы на известные уязвимости |
| SonarQube | Analyzes code quality and coverage | Анализирует качество кода и покрытие тестами |
| Quality Gate | Pass/fail rules for code quality | Правила «пройдено/не пройдено» для качества кода |
| OIDC | Login to AWS without stored keys | Вход в AWS без хранения ключей |
| ECR | AWS registry for Docker images | Реестр Docker-образов в AWS |

---

## 14. Troubleshooting

| Problem | Fix |
| --- | --- |
| Page says "Could not load flowers" | The backend is not running on port 3000. Start it with `npm start` in `backend/` |
| `port is already allocated` | Another process uses 3000 or 5173. Stop it, or run `docker compose down` |
| CI step 7 (Trivy) fails | A base image has a new fixable vulnerability. Rebuild with a newer base image tag or update the dependency |
| CI step 8 fails with connection errors | `SONAR_HOST_URL` is not reachable from the internet (see 9.1), or the secret is missing |
| CI step 9 fails | The Quality Gate is red. Open the project in SonarQube to see why |
| CD step 2: `Not authorized to perform sts:AssumeRoleWithWebIdentity` | The trust policy `sub` must match `repo:<GITHUB_USER>/flower-shop:ref:refs/heads/main` exactly |
| CD step 6: `repository ... does not exist` | Create the ECR repositories (10.1) and check the `ECR_*_REPOSITORY` variables |
