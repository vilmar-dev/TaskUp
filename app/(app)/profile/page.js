'use client';

import { useApp } from '@/components/Providers';
import { Banner, Fld } from '@/components/ui';

const CHANNELS = [
  ['Email', true],
  ['Slack', true],
  ['Microsoft Teams', false],
];

export default function Profile() {
  const { toast } = useApp();
  return (
    <>
      <Banner title="Profile and settings" sub="Your details, notifications, and connected accounts." />
      <div className="g2">
        <div className="card">
          <h3>Your details</h3>
          <Fld label="Name">
            <input className="in" type="text" placeholder="Juan Dela Cruz" />
          </Fld>
          <Fld label="Department">
            <input className="in" type="text" placeholder="Operations" />
          </Fld>
          <button className="btn p" onClick={() => toast('Profile saved')}>
            Save changes
          </button>
        </div>
        <div className="card">
          <h3>Notifications</h3>
          {CHANNELS.map((s) => (
            <div
              key={s[0]}
              className="row sb"
              style={{ padding: '10px 0', borderBottom: '1px solid var(--ln)' }}
            >
              <span>{s[0]}</span>
              <label className="sw">
                <input type="checkbox" defaultChecked={s[1]} aria-label={s[0]} />
                <span />
              </label>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
