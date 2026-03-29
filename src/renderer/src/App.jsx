import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Outreach from './pages/Outreach'
import Calendar from './pages/Calendar'
import RelationalMap from './pages/RelationalMap'
import Insights from './pages/Insights'
import Settings from './pages/Settings'
import './styles/App.css'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/contacts', label: 'Contacts', icon: '◎' },
  { to: '/outreach', label: 'Outreach', icon: '↗' },
  { to: '/calendar', label: 'Calendar', icon: '⬜' },
  { to: '/graph', label: 'Graph', icon: '⬡' },
  { to: '/insights', label: 'Insights', icon: '◈' }
]

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <div className="titlebar" />
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="logo-mark">◎</span>
            <span className="logo-text">Orbit</span>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer">
            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">⚙</span>
              <span className="nav-label">Settings</span>
            </NavLink>
          </div>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/graph" element={<RelationalMap />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
