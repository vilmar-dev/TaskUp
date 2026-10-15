
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { useApp } from '@/components/Providers';
import { NAV, SL } from '@/lib/data';
import { createClient } from '@/lib/supabase';

export default function AppLayout({ children }) {
  const { role, loaded, signOut } = useApp();

  const router = useRouter();
  const path = usePathname() || '';

  const [fullName, setFullName] = useState('');

  // Redirect users who are not logged in
  useEffect(() => {
    if (loaded && !role) {
      router.replace('/');
    }
  }, [loaded, role, router]);

  // Load the logged-in user's real name from Supabase
  useEffect(() => {
    if (!loaded || !role) return;

    let active = true;
    const supabase = createClient();

    async function loadProfile() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        if (active) setFullName('');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (!active) return;

      if (error) {
        console.error('Unable to load sidebar profile:', error);
        setFullName('');
        return;
      }

      setFullName(data?.full_name || '');
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [loaded, role]);

  if (!loaded || !role) return null;

  const s = role === 'supervisor';
  const active = path.replace('/', '');
  const go = (k) => router.push('/' + k);

  const displayName = fullName || 'Loading...';

  const initials = fullName
    ? fullName
        .trim()
        .split(/\s+/)
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div id="app" style={{ display: 'grid' }}>
      <aside>
        {/* LOGO */}
        <div className="logo">
          <span className="mark">
            <Icon n="check" />
          </span>

          <span className="lt">
            Hybrid Work Tasks
          </span>
        </div>

        {/* SIDEBAR NAVIGATION */}
        <nav className="nav">
          {NAV[role].map((n) => (
            <button
              key={n[0]}
              className={active === n[0] ? 'on' : ''}
              onClick={() => go(n[0])}
              title={n[1]}
            >
              <Icon n={n[2]} />
              <span className="nl">{n[1]}</span>
            </button>
          ))}
        </nav>

        {/* LOGGED-IN USER PROFILE */}
        <div className="me">
          <span className="av">
            {initials}
          </span>

          <div>
            <div
              style={{
                fontWeight: 600,
                color: '#fff',
              }}
            >
              {displayName}
            </div>

            <div className="sm">
              {s ? 'Supervisor' : 'Employee'}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div>
        <div className="top">
          <b
            id="crumb"
            style={{
              fontFamily: "'Bricolage Grotesque'",
            }}
          >
            {s ? 'Supervisor' : 'Employee'}

            <span className="wsp">
              {' '}workspace
            </span>
          </b>

          <div className="row">
            {/* NOTIFICATIONS */}
            <button
              aria-label="Notifications"
              onClick={() => go('notif')}
            >
              <Icon n="bell" />
              <i className="dot" />
            </button>

            {/* PROFILE */}
            <button
              aria-label="Profile"
              onClick={() => go('profile')}
            >
              <Icon n="user" />
            </button>

            {/* LOG OUT */}
            <button
              aria-label="Log out"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                signOut();
                router.replace('/');
              }}
            >
              <Icon n="out" />
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <main id="view">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav id="bn">
        {NAV[role].slice(0, 5).map((n) => (
          <button
            key={n[0]}
            className={active === n[0] ? 'on' : ''}
            onClick={() => go(n[0])}
          >
            <Icon n={n[2]} />
            {SL[n[0]]}
          </button>
        ))}
      </nav>
    </div>
  );
}
