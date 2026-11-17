
'use client';

import { useEffect, useState } from 'react';
import { Banner } from '@/components/ui';
import { createClient } from '@/lib/supabase';

function getMonday(date) {
  const result = new Date(date);
  const day = result.getDay();

  result.setDate(
    result.getDate() - (day === 0 ? 6 : day - 1)
  );

  result.setHours(0, 0, 0, 0);
  return result;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
  });
}

function formatMonth(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(time) {
  if (!time) return '';

  const [hours, minutes] = time.split(':');

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function MyShift() {
  const [weekStart, setWeekStart] = useState(() =>
    getMonday(new Date())
  );

  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date();

  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return date;
  });

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  // Load the authenticated employee's actual schedule.
  useEffect(() => {
    let cancelled = false;

    async function loadMySchedule() {
      setLoading(true);
      setError('');

      try {
        const supabase = createClient();

        // Get authenticated employee
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          throw new Error('Please sign in to view your schedule.');
        }

        const startDate = toDateKey(weekStart);
        const endDate = toDateKey(weekEnd);

        // Retrieve employee's assigned shifts
        const {
          data: shifts,
          error: shiftError,
        } = await supabase
          .from('shifts')
          .select(`
            shift_date,
            start_time,
            end_time,
            work_mode,
            updated_at
          `)
          .eq('employee_id', user.id)
          .gte('shift_date', startDate)
          .lte('shift_date', endDate)
          .order('updated_at', {
            ascending: false,
          });

        if (shiftError) throw shiftError;

        // Retrieve approved leave requests overlapping this week
        const {
          data: leaveRequests,
          error: leaveError,
        } = await supabase
          .from('time_off_requests')
          .select(`
            start_date,
            end_date,
            status
          `)
          .eq('employee_id', user.id)
          .eq('status', 'approved')
          .lte('start_date', endDate)
          .gte('end_date', startDate);

        if (leaveError) throw leaveError;

        // Build daily schedule
        const dailySchedule = {};

        // Default schedule: 8 AM - 6 PM, every day
        weekDates.forEach((date) => {
          const dateKey = toDateKey(date);

          dailySchedule[dateKey] = {
            status: 'regular',
            start_time: '08:00:00',
            end_time: '18:00:00',
          };
        });

        // Apply manually assigned shifts
        // Most recently updated shift takes precedence
        (shifts || []).forEach((shift) => {
          const dateKey = shift.shift_date;

          if (
            dailySchedule[dateKey] &&
            dailySchedule[dateKey].status === 'regular'
          ) {
            dailySchedule[dateKey] = {
              status:
                shift.work_mode === 'remote'
                  ? 'remote'
                  : 'on-site',
              start_time: shift.start_time,
              end_time: shift.end_time,
            };
          }
        });

        // Approved leave overrides regular or assigned shifts
        (leaveRequests || []).forEach((request) => {
          weekDates.forEach((date) => {
            const dateKey = toDateKey(date);

            if (
              dateKey >= request.start_date &&
              dateKey <= request.end_date
            ) {
              dailySchedule[dateKey] = {
                status: 'leave',
                start_time: null,
                end_time: null,
              };
            }
          });
        });

        if (!cancelled) {
          setSchedule(dailySchedule);
        }
      } catch (err) {
        console.error('My Shift Error:', err);

        if (!cancelled) {
          setError(
            err.message || 'Unable to load your schedule.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMySchedule();

    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  function changeWeek(direction) {
    setWeekStart((previous) => {
      const next = new Date(previous);
      next.setDate(next.getDate() + direction * 7);
      return next;
    });
  }

  function isToday(date) {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #eee5ff',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 8px 25px rgba(92,49,180,0.06)',
  };

  const buttonStyle = {
    background: '#ffffff',
    border: '1px solid #e6dcff',
    color: '#6734e8',
    padding: '10px 16px',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
  };

  const statusColors = {
    regular: {
      background: '#eee7ff',
      color: '#7136d9',
      label: 'Regular',
    },
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
    leave: {
      background: '#ffe4e8',
      color: '#d13c61',
      label: 'On Leave',
    },
  };

  return (
    <>
      <Banner
        title="My Shift"
        sub="View your weekly work schedule and assigned working hours."
      />

      <div
        style={{
          padding: '0 24px 30px',
          marginTop: 20,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* WEEKLY SCHEDULE */}
        <div style={cardStyle}>

          {/* WEEK NAVIGATION */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 15,
              marginBottom: 22,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  color: '#29204f',
                }}
              >
                Week of {formatMonth(weekStart)}
              </h3>

              <p
                style={{
                  color: '#81769c',
                  fontSize: 13,
                  margin: '6px 0 0',
                }}
              >
                Your personal weekly schedule
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <button
                style={buttonStyle}
                onClick={() => changeWeek(-1)}
              >
                ← Previous
              </button>

              <button
                style={buttonStyle}
                onClick={() =>
                  setWeekStart(getMonday(new Date()))
                }
              >
                Today
              </button>

              <button
                style={buttonStyle}
                onClick={() => changeWeek(1)}
              >
                Next →
              </button>
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div
              style={{
                padding: 35,
                textAlign: 'center',
                color: '#81769c',
              }}
            >
              Loading your schedule...
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                background: '#fff0f0',
                color: '#d13c61',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {/* WEEKLY CALENDAR */}
          {!loading && !error && (
            <div
              style={{
                width: '100%',
                overflowX: 'auto',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(7, minmax(115px, 1fr))',
                  minWidth: 850,
                  gap: 10,
                }}
              >
                {weekDates.map((date) => {
                  const dateKey = toDateKey(date);
                  const shift = schedule[dateKey];

                  const todayFlag = isToday(date);

                  const status = shift
                    ? statusColors[shift.status]
                    : null;

                  return (
                    <div
                      key={dateKey}
                      style={{
                        border: todayFlag
                          ? '2px solid #8738ed'
                          : '1px solid #eee5ff',
                        borderRadius: 12,
                        padding: 13,
                        minHeight: 175,
                        background: todayFlag
                          ? '#faf7ff'
                          : '#ffffff',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: '#766a96',
                          marginBottom: 12,
                        }}
                      >
                        {formatDate(date)}
                      </div>

                      {todayFlag && (
                        <div
                          style={{
                            color: '#8738ed',
                            fontSize: 10,
                            fontWeight: 700,
                            marginBottom: 10,
                          }}
                        >
                          TODAY
                        </div>
                      )}

                      {shift && status && (
                        <>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '5px 10px',
                              borderRadius: 20,
                              background: status.background,
                              color: status.color,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {status.label}
                          </span>

                          {shift.status !== 'leave' && (
                            <div
                              style={{
                                marginTop: 12,
                                color: '#81769c',
                                fontSize: 12,
                                lineHeight: 1.7,
                              }}
                            >
                              {formatTime(shift.start_time)}
                              <br />
                              {formatTime(shift.end_time)}
                            </div>
                          )}

                          {shift.status === 'leave' && (
                            <div
                              style={{
                                marginTop: 12,
                                color: '#d13c61',
                                fontSize: 12,
                              }}
                            >
                              Approved leave
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SCHEDULE INFORMATION */}
        <div
          style={{
            ...cardStyle,
            marginTop: 20,
          }}
        >
          <h3
            style={{
              margin: '0 0 15px',
              fontSize: 16,
              color: '#29204f',
            }}
          >
            Schedule Information
          </h3>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              alignItems: 'center',
            }}
          >
            {[
              {
                color: '#7136d9',
                label: 'Regular schedule',
              },
              {
                color: '#079968',
                label: 'On-site',
              },
              {
                color: '#bd7914',
                label: 'Remote',
              },
              {
                color: '#d13c61',
                label: 'On Leave',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 12,
                  color: '#81769c',
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: item.color,
                  }}
                />
                {item.label}
              </div>
            ))}
          </div>

          <p
            style={{
              margin: '18px 0 0',
              color: '#81769c',
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            Your default working hours are 8:00 AM to
            6:00 PM every day. Approved leave requests
            automatically appear as On Leave.
          </p>
        </div>
      </div>
    </>
  );
}
