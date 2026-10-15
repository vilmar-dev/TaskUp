'use client';

import Icon from '@/components/Icon';
import { Banner, Stat, useNav } from '@/components/ui';

export default function SupervisorOverview() {
  const { go } = useNav();
  return (
    <>
      <Banner
        title="Organization overview"
        sub="Team workload, pending reviews, and task progress at a glance."
        action={
          <button className="btn p" onClick={() => go('taskcreate')}>
            <Icon n="plus" />
            Assign new task
          </button>
        }
      />
      <div className="g4">
        <Stat i={0} l="Employees" v={18} />
        <Stat i={1} l="Active tasks" v={142} />
        <Stat i={2} l="Overdue" v={6} />
        <Stat i={0} l="Pending review" v={4} c="hl" />
      </div>
      <div className="card mt">
        <div className="row sb">
          <h3>Team workload</h3>
          <button className="btn lnk" onClick={() => go('users')}>
            Manage team
          </button>
        </div>
        <div className="tw">
          <table>
            <tbody>
              <tr className="hd">
                <th>Employee</th>
                <th>Active</th>
                <th>Overdue</th>
                <th>Load</th>
              </tr>
              <tr>
                <td data-l="Employee">Juan D.</td>
                <td data-l="Active">7</td>
                <td data-l="Overdue">0</td>
                <td data-l="Load" style={{ width: '30%' }}>
                  <div className="bar">
                    <i style={{ width: '70%' }} />
                  </div>
                </td>
              </tr>
              <tr>
                <td data-l="Employee">Maria S.</td>
                <td data-l="Active">5</td>
                <td data-l="Overdue">
                  <span className="chip hi">1 overdue</span>
                </td>
                <td data-l="Load">
                  <div className="bar">
                    <i style={{ width: '50%' }} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="card mt">
        <div className="row sb">
          <h3>Waiting for your review</h3>
          <button className="btn lnk" onClick={() => go('evaluate')}>
            Evaluate
          </button>
        </div>
        <button className="item" onClick={() => go('evaluate')}>
          <span>
            <b>Client email batch</b>
            <br />
            <span className="muted sm">Maria S. submitted Sept 20</span>
          </span>
          <span className="chip pd">Pending</span>
        </button>
      </div>
    </>
  );
}
