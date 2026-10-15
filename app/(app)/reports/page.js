'use client';

import Icon from '@/components/Icon';
import { useApp } from '@/components/Providers';
import { Banner } from '@/components/ui';

const WEEKS = [
  ['W1', 55],
  ['W2', 72],
  ['W3', 48],
  ['W4', 88],
];

export default function Reports() {
  const { toast } = useApp();
  return (
    <>
      <Banner
        title="Reports"
        sub="Accomplishment monitoring across your team."
        action={
          <button className="btn" onClick={() => toast('Report exported')}>
            <Icon n="up" />
            Export report
          </button>
        }
      />
      <div className="card">
        <h3>Completed per week</h3>
        <div className="bars">
          {WEEKS.map((b) => (
            <div key={b[0]}>
              <i style={{ height: b[1] + '%' }} />
              <span className="muted sm">{b[0]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card mt">
        <h3>Accomplishment log</h3>
        <div className="tw">
          <table>
            <tbody>
              <tr className="hd">
                <th>Employee</th>
                <th>Task</th>
                <th>Completed</th>
                <th>On time</th>
              </tr>
              <tr>
                <td data-l="Employee">Juan D.</td>
                <td data-l="Task">Chapter 2 draft</td>
                <td data-l="Completed">Sept 18</td>
                <td data-l="On time">
                  <span className="chip ok">Yes</span>
                </td>
              </tr>
              <tr>
                <td data-l="Employee">Maria S.</td>
                <td data-l="Task">Client email batch</td>
                <td data-l="Completed">Sept 20</td>
                <td data-l="On time">
                  <span className="chip hi">Late</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
