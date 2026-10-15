'use client';

import { Banner } from '@/components/ui';

const FLOW = [
  ['Login', 'Employee tab opens the Employee Dashboard. Supervisor tab opens the Supervisor Overview.'],
  ['Employee dashboard', 'Task board, submit accomplishment, performance records, notifications, and profile.'],
  ['Task detail', 'Employee: update progress and submit accomplishment. Supervisor: edit task.'],
  ['Supervisor overview', 'Task board, create and assign tasks, evaluate, manage team, and reports.'],
  ['Evaluate accomplishments', 'Approve or request revision. Updates the employee performance record.'],
  ['Back button', 'Returns to the exact screen you came from.'],
];

export default function FlowMap() {
  return (
    <>
      <Banner title="Navigation flow map" sub="How each role moves through the app." />
      <div className="g2">
        {FLOW.map((f) => (
          <div className="card" key={f[0]}>
            <h3>{f[0]}</h3>
            <p className="muted" style={{ margin: 0 }}>
              {f[1]}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
