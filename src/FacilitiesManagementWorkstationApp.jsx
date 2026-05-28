export default function FacilitiesManagementWorkstationApp() {
  const modules = [
    {
      title: 'Asset Management',
      description:
        'Track assets, lifecycle, maintenance schedules, depreciation, and inventory.',
      icon: '📦',
    },
    {
      title: 'Work Allocation',
      description:
        'Assign technicians, manage tasks, monitor SLAs, and track job completion.',
      icon: '🛠️',
    },
    {
      title: 'E-Learning Platform',
      description:
        'Training courses, certifications, compliance modules, and staff onboarding.',
      icon: '🎓',
    },
    {
      title: 'Microsoft Office Integration',
      description:
        'Integrated Word, Excel, Outlook, Teams, and SharePoint workflows.',
      icon: '📄',
    },
    {
      title: 'GPS Location Tracking',
      description:
        'Live staff tracking, route optimization, and geo-fencing for field teams.',
      icon: '📍',
    },
    {
      title: 'OHSA Compliance System',
      description:
        'Incident reporting, safety audits, compliance tracking, and inspections.',
      icon: '⚠️',
    },
    {
      title: 'AI Automation Tools',
      description:
        'AI-powered reporting, predictive maintenance, chatbot support, and analytics.',
      icon: '🤖',
    },
    {
      title: 'WhatsApp Integration',
      description:
        'Instant notifications, work order updates, and communication automation.',
      icon: '💬',
    },
    {
      title: 'Telegram Integration',
      description:
        'Team communication, bot automation, and broadcast notifications.',
      icon: '📲',
    },
  ];

  const stats = [
    { label: 'Active Assets', value: '12,548' },
    { label: 'Open Work Orders', value: '186' },
    { label: 'Technicians Online', value: '48' },
    { label: 'Safety Compliance', value: '97%' },
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Facilities Management Workstation</h1>
          <p>Smart AI-Driven Facilities, Asset, and Workforce Management Platform</p>
        </div>
        <div className="action-buttons">
          <button className="button-primary">Dashboard</button>
          <button className="button-secondary">Reports</button>
          <button className="button-secondary">AI Assistant</button>
        </div>
      </header>

      <main className="content">
        <section className="stats-grid">
          {stats.map((stat) => (
            <article key={stat.label} className="stat-card">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="module-section">
          <div className="section-header">
            <h2>Core Modules</h2>
            <input type="text" placeholder="Search module..." disabled />
          </div>

          <div className="module-grid">
            {modules.map((module) => (
              <article key={module.title} className="module-card">
                <div className="module-icon">{module.icon}</div>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <button className="button-primary button-block">Open Module</button>
              </article>
            ))}
          </div>
        </section>

        <section className="feature-grid">
          <article className="feature-card feature-highlight">
            <h2>AI Automation Features</h2>
            <ul>
              <li>Predictive maintenance recommendations</li>
              <li>Smart asset lifecycle analytics</li>
              <li>AI-generated reports and dashboards</li>
              <li>Automated incident detection</li>
              <li>Voice and chatbot assistance</li>
              <li>Intelligent work order routing</li>
            </ul>
          </article>

          <article className="feature-card">
            <h2>System Integrations</h2>
            <div className="integration-grid">
              {[
                'Microsoft Teams',
                'Outlook',
                'SharePoint',
                'WhatsApp API',
                'Telegram Bot API',
                'Azure Cloud',
                'Power BI',
                'GPS Mapping Services',
              ].map((integration) => (
                <div key={integration} className="integration-pill">
                  {integration}
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
