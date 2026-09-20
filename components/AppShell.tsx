'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Overview', icon: '⌂' },
  { href: '/templates', label: 'Template library', icon: '▦' },
  { href: '/import', label: 'Import template', icon: '↥' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Hive home">
          <span className="brand-mark">H</span>
          <span>
            <strong>hive</strong>
            <small>template studio</small>
          </span>
        </Link>

        <nav className="primary-nav" aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          {navItems.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link className={`nav-link${active ? ' active' : ''}`} href={item.href} key={item.href}>
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="status-dot" />
          <div>
            <strong>Workspace ready</strong>
            <span>Changes save as you work</span>
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">H</span><strong>hive</strong></div>
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {navItems.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return <Link className={active ? 'mobile-nav-link active' : 'mobile-nav-link'} href={item.href} key={item.href}>{item.label}</Link>
            })}
          </nav>
          <div className="topbar-spacer" />
          <Link className="topbar-action" href="/import">
            <span aria-hidden="true">+</span> New import
          </Link>
          <div className="avatar" aria-label="Workspace account">HS</div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}
