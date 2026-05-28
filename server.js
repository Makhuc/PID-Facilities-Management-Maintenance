const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const assets = [
  { id: 1, name: 'HVAC Unit 1', category: 'Mechanical', status: 'functional', location: 'Building A', notes: 'Routine inspection due' },
  { id: 2, name: 'Elevator 3', category: 'Vertical Transport', status: 'damaged', location: 'Building B', notes: 'Requires safety panel replacement' },
  { id: 3, name: 'Fire Alarm Panel', category: 'Safety', status: 'functional', location: 'Building C', notes: 'Last tested 02/2026' }
];

const workOrders = [
  { id: 1, title: 'Replace light fixtures', assignee: 'Technician A', priority: 'Medium', status: 'Open', dueDate: '2026-05-10', location: 'Floor 2' },
  { id: 2, title: 'Inspect roof drains', assignee: 'Technician B', priority: 'High', status: 'Assigned', dueDate: '2026-04-24', location: 'Building A' }
];

const maintenanceItems = [
  { id: 1, item: 'Boiler servicing', schedule: '2026-05-15', status: 'Planned', owner: 'Maintenance Lead' },
  { id: 2, item: 'Generator load test', schedule: '2026-06-01', status: 'In Progress', owner: 'Electrical Team' }
];

const reports = [];
const users = [
  { id: 1, role: 'employer', name: 'Employer Admin', email: 'employer@company.com' },
  { id: 2, role: 'employee', name: 'Field Technician', email: 'employee@company.com' }
];

const wipData = [
  { id: 1, batch: 'Maintenance Cycle 1', progress: 42, status: 'In progress' },
  { id: 2, batch: 'Inspection Round', progress: 78, status: 'In review' }
];

const openaiKey = process.env.OPENAI_API_KEY || '';
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

app.get('/api/assets', (req, res) => {
  const status = req.query.status;
  if (status) {
    return res.json(assets.filter(asset => asset.status === status));
  }
  res.json(assets);
});

app.post('/api/assets/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Excel file is required' });
  }

  const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const imported = rows.map((row, index) => ({
    id: assets.length + index + 1,
    name: row['Name'] || row['Asset Name'] || `Imported Asset ${assets.length + index + 1}`,
    category: row['Category'] || 'Unspecified',
    status: row['Status'] ? row['Status'].toString().toLowerCase() : 'functional',
    location: row['Location'] || 'Unknown',
    notes: row['Notes'] || ''
  }));

  assets.push(...imported);
  res.json({ imported, totalAssets: assets.length });
});

app.get('/api/workorders', (req, res) => {
  res.json(workOrders);
});

app.post('/api/workorders', (req, res) => {
  const order = req.body;
  order.id = workOrders.length + 1;
  workOrders.push(order);
  res.json(order);
});

app.get('/api/maintenance', (req, res) => {
  res.json(maintenanceItems);
});

app.get('/api/wip', (req, res) => {
  res.json(wipData);
});

app.get('/api/users', (req, res) => {
  const role = req.query.role;
  if (role) {
    return res.json(users.filter(user => user.role === role));
  }
  res.json(users);
});

app.post('/api/reports/upload', upload.single('report'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Report file is required' });
  }

  const report = {
    id: reports.length + 1,
    name: req.file.originalname,
    uploadedAt: new Date().toISOString(),
    size: req.file.size,
    mimeType: req.file.mimetype
  };
  reports.push(report);
  res.json(report);
});

app.get('/api/reports', (req, res) => {
  res.json(reports);
});

app.get('/api/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  const results = [];
  if (!query) {
    return res.json({ query, results });
  }

  const searchIn = [
    ...assets.map(asset => ({ type: 'asset', item: asset })),
    ...workOrders.map(order => ({ type: 'workorder', item: order })),
    ...maintenanceItems.map(task => ({ type: 'maintenance', item: task })),
    ...reports.map(report => ({ type: 'report', item: report }))
  ];

  searchIn.forEach(entry => {
    const text = JSON.stringify(entry.item).toLowerCase();
    if (text.includes(query)) {
      results.push(entry);
    }
  });

  res.json({ query, results });
});

app.post('/api/ai', async (req, res) => {
  const prompt = req.body.prompt || 'Summarize the facility status';
  if (!openai) {
    return res.json({
      prompt,
      response: 'AI is not configured. Set OPENAI_API_KEY in .env to enable AI responses.'
    });
  }

  try {
    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: `Facility management assistant prompt:\n${prompt}`
    });
    const answer = completion.output[0]?.content[0]?.text || 'No response available.';
    res.json({ prompt, response: answer });
  } catch (error) {
    res.status(500).json({ error: error.message || 'OpenAI request failed' });
  }
});

app.get('/api/outlook-teams', (req, res) => {
  res.json({
    outlook: 'https://outlook.office.com',
    teams: 'https://teams.microsoft.com',
    note: 'Use Microsoft Graph to integrate calendars, meetings, and notifications for your employer and employee workflows.'
  });
});

app.listen(port, () => {
  console.log(`Facilities management app server running at http://localhost:${port}`);
});
