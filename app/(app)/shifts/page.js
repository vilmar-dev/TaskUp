
'use client';

import { useState } from 'react';
import { useNav } from '@/components/ui';

const employees = [
  {
    name: 'Juan D.',
    shifts: ['on-site', 'remote', 'remote', 'on-site', 'remote', 'off', 'off'],
  },
  {
    name: 'Maria S.',
    shifts: ['remote', 'remote', 'on-site', 'remote', 'remote', 'off', 'off'],
  },
  {
    name: 'Liza P.',
    shifts: ['remote', 'on-site', 'remote', 'remote', 'on-site', 'off', 'off'],
  },
  {
    name: 'Carlo M.',
    shifts: ['on-site', 'remote', 'remote', 'on-site', 'remote', 'off', 'off'],
  },
  {
    name: 'Ben T.',
    shifts: ['remote', 'remote', 'on-site', 'remote', 'remote', 'off', 'off'],
  },
];

const shiftTimes = {
  'on-site': '9:00–6:00',
  remote: '9:00–6:00',
  off: '',
};

function getMonday(date) {
  const result = new Date(date);
  const day = result.getDay();

  result.setDate(
    result.getDate() - (day === 0 ? 6 : day - 1)
  );

  result.setHours(0, 0, 0, 0);

  return result;
}

function formatWeekDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
  });
}

export default function Shifts() {
  const { back } = useNav();

  const [weekStart, setWeekStart] = useState(() =>
    getMonday(new Date())
  );

  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const weekLabel = weekStart.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function changeWeek(direction) {
    setWeekStart((previous) => {
      const next = new Date(previous);
      next.setDate(next.getDate() + direction * 7);
      return next;
    });
  }

  const styles = {
    page: {
      width: '100%',
      minWidth: 0,
      paddingBottom: 35,
      boxSizing: 'border-box',
    },

    header: {
      background: 'linear-gradient(110deg, #4421d9, #a52de5)',
      padding: '24px 30px 30px',
      color: '#ffffff',
      width: '100%',
      boxSizing: 'border-box',
    },

    backButton: {
      border: 'none',
      background: 'transparent',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      padding: '0 0 10px',
    },

    content: {
      width: '100%',
      padding: '0 24px 30px',
      marginTop: 20,
      boxSizing: 'border-box',
      position: 'relative',
    },

    tableCard: {
      background: '#ffffff',
      borderRadius: 18,
      padding: 16,
      width: '100%',
      boxSizing: 'border-box',
      boxShadow: '0 8px 25px rgba(92, 49, 180, 0.07)',
      border: '1px solid #eee5ff',
    },

    controls: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 18,
    },

    weekLabel: {
      fontWeight: 700,
      fontSize: 16,
      color: '#29204f',
    },

    controlButton: {
      border: '1px solid #e6dcff',
      background: '#ffffff',
      color: '#6734e8',
      padding: '9px 15px',
      borderRadius: 10,
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: 13,
    },

    tableWrapper: {
      width: '100%',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
    },

    table: {
      width: '100%',
      minWidth: 850,
      borderCollapse: 'separate',
      borderSpacing: 0,
      fontSize: 13,
      color: '#30264f',
    },

    headerCell: {
      background: '#faf7ff',
      color: '#766a96',
      fontWeight: 700,
      padding: '14px 12px',
      textAlign: 'center',
      borderBottom: '1px solid #e9e0fa',
      whiteSpace: 'nowrap',
    },

    employeeCell: {
      padding: '18px 13px',
      fontWeight: 500,
      textAlign: 'left',
      whiteSpace: 'nowrap',
      borderBottom: '1px solid #eee7fa',
    },

    shiftCell: {
      padding: '12px 8px',
      textAlign: 'center',
      borderBottom: '1px solid #eee7fa',
      minWidth: 100,
    },

    time: {
      fontSize: 12,
      color: '#8479a5',
      marginTop: 5,
    },
  };

  function renderShift(status) {
    const colors = {
      'on-site': {
        background: '#dff4eb',
        color: '#079968',
        label: 'On-site',
      },
      remote: {
        background: '#fff0dc',
        color: '#bd7914',
        label: 'Remote',
      },
      off: {
        background: 'transparent',
        color: '#81769c',
        label: 'Off',
      },
    };

    const current = colors[status] || colors.off;

    return (
      <div>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 11px',
            borderRadius: 20,
            background: current.background,
            color: current.color,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {current.label}
        </span>

        {status !== 'off' && (
          <div style={styles.time}>
            {shiftTimes[status]}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* PAGE HEADER */}
      <div style={styles.header}>
        <button
          style={styles.backButton}
          onClick={back}
        >
          ← &nbsp; Back
        </button>

        <h1
          style={{
            fontSize: 27,
            fontWeight: 750,
            margin: '0 0 5px',
          }}
        >
          Shift calendar
        </h1>

        <p
          style={{
            fontSize: 13,
            opacity: 0.85,
            margin: 0,
          }}
        >
          Weekly schedule: on-site, remote, or day off.
        </p>
      </div>

      {/* CALENDAR CONTENT */}
      <div style={styles.content}>
        <div style={styles.tableCard}>

          {/* WEEK NAVIGATION */}
          <div style={styles.controls}>
            <div style={styles.weekLabel}>
              Week of {weekLabel}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <button
                style={styles.controlButton}
                onClick={() => changeWeek(-1)}
              >
                ← Previous
              </button>

              <button
                style={styles.controlButton}
                onClick={() =>
                  setWeekStart(getMonday(new Date()))
                }
              >
                Today
              </button>

              <button
                style={styles.controlButton}
                onClick={() => changeWeek(1)}
              >
                Next →
              </button>
            </div>
          </div>

          {/* WEEKLY TABLE */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th
                    style={{
                      ...styles.headerCell,
                      textAlign: 'left',
                      borderTopLeftRadius: 12,
                    }}
                  >
                    Employee
                  </th>

                  {weekDates.map((date, index) => (
                    <th
                      key={index}
                      style={{
                        ...styles.headerCell,
                        borderTopRightRadius:
                          index === 6 ? 12 : 0,
                      }}
                    >
                      {formatWeekDate(date)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.name}>
                    <td style={styles.employeeCell}>
                      {employee.name}
                    </td>

                    {employee.shifts.map((shift, dayIndex) => (
                      <td
                        key={dayIndex}
                        style={styles.shiftCell}
                      >
                        {renderShift(shift)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
