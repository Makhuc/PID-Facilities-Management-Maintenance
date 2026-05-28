# Facilities Management App

A full-stack facilities management prototype with asset tracking, work allocation, maintenance lists, WIP data, Excel asset upload, report upload, search, and AI assistant support.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the React front-end app:

```bash
npm run dev
```

5. Open the app in your browser at the local Vite URL shown in the terminal.

## Deploy to Azure Static Web Apps

1. Create a new Azure Static Web App in the Azure portal.
2. Connect it to this GitHub repo: `Makhuc/PID-Facilities-Management-Maintenance`.
3. Choose branch `main`.
4. Set App location to `/` and Output location to `dist`.
5. After the resource is created, add the deployment token to this repo's GitHub secrets as `AZURE_STATIC_WEB_APPS_API_TOKEN`.

> Important: the workflow will fail if the Azure Static Web App resource is not created and the deployment token secret is missing or invalid.

The repository now includes a workflow file at `.github/workflows/azure-static-web-apps.yml` that builds the Vite app and deploys it to Azure.

6. Commit and push your changes to `main` to trigger deployment.

If you need, I can help you with generating the GitHub secret and completing the Azure Static Web App setup.

3. If you want to keep using the existing Express server, run it separately with:

```bash
node server.js
```

5. Create a `.env` file in the project root with any API keys you need for the backend, for example:

```text
OPENAI_API_KEY=your_openai_api_key_here
PORT=4000
```

## Features

- Asset management: functional, damaged, and all assets
- Excel asset import via upload
- Work allocation and maintenance workloads
- Employer/employee role view endpoints
- Report upload and management
- Search engine across assets, work orders, maintenance, and reports
- AI assistant endpoint for future intelligent workflows
- Outlook and Teams integration stub

## Local IP

To access this app from another device on your network, use your machine IP address. On Windows, run:

```powershell
ipconfig
```

Then open:

```text
http://<YOUR_LOCAL_IP>:4000
```

## Notes

- This scaffold is a starting point. For production, add authentication, persistent storage, and secure Microsoft Graph integration.
- Excel upload expects columns like `Name`, `Category`, `Status`, `Location`, and `Notes`.
