'use client';

import { Banner, Stat } from '@/components/ui';

export default function Performance() {
  return (
    <>
      <Banner title="Performance records" sub="Your completed tasks and supervisor evaluations." />
      <div className="g2">
        <Stat i={0} l="Tasks completed" v={42} />
        <Stat i={1} l="On-time rate" v="89%" c="hl" />
      </div>
      <div className="card mt">
        <h3>Evaluation history</h3>
        <div className="tw">
          <table>
            <tbody>
              <tr className="hd">
                <th>Task</th>
                <th>Date</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
              <tr>
                <td data-l="Task">Chapter 2 draft</td>
                <td data-l="Date">Sept 18</td>
                <td data-l="Status">
                  <span className="chip ok">Approved</span>
                </td>
                <td data-l="Remarks">On time, good quality</td>
              </tr>
              <tr>
                <td data-l="Task">Client email batch</td>
                <td data-l="Date">Sept 20</td>
                <td data-l="Status">
                  <span className="chip ok">Approved</span>
                </td>
                <td data-l="Remarks">Submitted late</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
