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

3. Open the app in your browser at the local Vite URL shown in the terminal.

4. If you want to keep using the existing Express server, run it separately with:

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
