
'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Banner } from '@/components/ui';

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;
}

function getMonthKey(value) {
  return String(value || '').slice(0, 7);
}

function formatMonth(value) {
  if (!value) return 'Unknown month';

  const [year, month] = value.split('-');

  return new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
}

function MetricCard({ title, value, subtitle, color }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div
        style={{
          fontSize: 13,
          color: '#77718f',
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: color || '#30206f',
        }}
      >
        {value}
      </div>

      <div className="muted sm" style={{ marginTop: 5 }}>
        {subtitle}
      </div>
    </div>
  );
}

export default function MonthlyStats() {
  const [records, setRecords] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(
    getCurrentMonth()
  );

  // Generate the current month and previous 35 months.
  const monthOptions = useMemo(() => {
    const current = new Date();
    current.setDate(1);

    return Array.from({ length: 36 }, (_, index) => {
      const date = new Date(
        current.getFullYear(),
        current.getMonth() - index,
        1
      );

      const value = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;

      return {
        value,
        label: formatMonth(value),
      };
    });
  }, []);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // LOAD MONTHLY STATISTICS
  async function loadStatistics(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Please log in again.');
      }

      const { data, error: fetchError } = await supabase
        .from('monthly_task_completion_stats')
        .select(`
          employee_id,
          full_name,
          department,
          month,
          completed_tasks,
          average_progress,
          average_rating,
          total_evaluations
        `)
        .order('month', { ascending: false })
        .order('full_name', { ascending: true });

      if (fetchError) throw fetchError;

      setRecords(data || []);

    } catch (err) {
      console.error('Monthly statistics error:', err);

      setError(
        err.message || 'Unable to load monthly statistics.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStatistics();
  }, []);

  // FILTER RECORDS BY SELECTED MONTH
  const monthlyRecords = useMemo(() => {
    return records.filter(
      (record) =>
        getMonthKey(record.month) === selectedMonth
    );
  }, [records, selectedMonth]);

  // CALCULATE MONTHLY STATISTICS
  const stats = useMemo(() => {
    const completedTasks = monthlyRecords.reduce(
      (sum, record) =>
        sum + Number(record.completed_tasks || 0),
      0
    );

    const completedEmployees = monthlyRecords.filter(
      (record) =>
        Number(record.completed_tasks || 0) > 0
    ).length;

    const weightedProgress = monthlyRecords.reduce(
      (sum, record) =>
        sum +
        Number(record.average_progress || 0) *
        Number(record.completed_tasks || 0),
      0
    );

    const averageProgress = completedTasks
      ? weightedProgress / completedTasks
      : 0;

    const totalEvaluations = monthlyRecords.reduce(
      (sum, record) =>
        sum + Number(record.total_evaluations || 0),
      0
    );

    const weightedRating = monthlyRecords.reduce(
      (sum, record) =>
        sum +
        Number(record.average_rating || 0) *
        Number(record.total_evaluations || 0),
      0
    );

    const averageRating = totalEvaluations
      ? weightedRating / totalEvaluations
      : 0;

    return {
      completedTasks,
      completedEmployees,
      averageProgress,
      averageRating,
      totalEvaluations,
    };
  }, [monthlyRecords]);

  // EMPLOYEE PERFORMANCE RANKING
  const ranking = useMemo(() => {
    return [...monthlyRecords]
      .filter(
        (record) =>
          Number(record.completed_tasks || 0) > 0
      )
      .sort(
        (a, b) =>
          Number(b.completed_tasks || 0) -
          Number(a.completed_tasks || 0)
      );
  }, [monthlyRecords]);

  // SELECTED MONTH AND PREVIOUS FIVE MONTHS
  const trend = useMemo(() => {
    if (!selectedMonth) return [];

    const [year, month] = selectedMonth
      .split('-')
      .map(Number);

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        year,
        month - 1 - (5 - index),
        1
      );

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;

      const monthRows = records.filter(
        (record) => getMonthKey(record.month) === key
      );

      const total = monthRows.reduce(
        (sum, record) =>
          sum + Number(record.completed_tasks || 0),
        0
      );

      return {
        key,
        label: date.toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        }),
        total,
      };
    });
  }, [records, selectedMonth]);

  const maxTrend = Math.max(
    1,
    ...trend.map((item) => item.total)
  );

  return (
    <>
      <Banner
        title="Monthly Statistics"
        sub="Monitor employee task completion and monthly performance."
      />

      {/* MONTH SELECTOR */}
      <div className="card mt">
        <div className="row sb wrap">
          <div>
            <h3>Monthly Performance Overview</h3>

            <p className="muted sm">
              Select a month to view historical task statistics
              and employee performance.
            </p>
          </div>

          <div style={{ minWidth: 190 }}>
            <label className="muted sm">
              Select Month
            </label>

            <select
              className="in"
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(e.target.value)
              }
              style={{
                width: '100%',
                marginTop: 6,
                minWidth: 190,
                cursor: 'pointer',
              }}
            >
              {monthOptions.map((month) => (
                <option
                  key={month.value}
                  value={month.value}
                >
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="row sb wrap"
          style={{ marginTop: 18 }}
        >
          <p className="muted sm">
            Showing:{' '}
            <strong>{formatMonth(selectedMonth)}</strong>
          </p>

          <button
            className="btn"
            onClick={() => loadStatistics(true)}
            disabled={loading || refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card mt">
          <p>Loading monthly statistics...</p>
        </div>
      ) : error ? (
        <div className="card mt">
          <h3>Unable to load statistics</h3>

          <p style={{ color: '#dc3545' }}>
            {error}
          </p>

          <button
            className="btn p"
            onClick={() => loadStatistics()}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* MONTHLY METRICS */}
          <div
            className="g3 mt"
            style={{
              gridTemplateColumns:
                'repeat(4, minmax(0, 1fr))',
            }}
          >
            <MetricCard
              title="Completed Tasks"
              value={formatNumber(stats.completedTasks)}
              subtitle="Completed this month"
              color="#7135f5"
            />

            <MetricCard
              title="Active Contributors"
              value={formatNumber(stats.completedEmployees)}
              subtitle="Employees with completed tasks"
              color="#16a36a"
            />

            <MetricCard
              title="Average Progress"
              value={`${formatNumber(stats.averageProgress)}%`}
              subtitle="Task-weighted average"
              color="#d18400"
            />

            <MetricCard
              title="Average Rating"
              value={
                stats.totalEvaluations
                  ? `${formatNumber(stats.averageRating)} / 5`
                  : 'N/A'
              }
              subtitle={`${stats.totalEvaluations} evaluations`}
              color="#a33be5"
            />
          </div>

          {/* COMPLETION TREND AND PERFORMANCE SUMMARY */}
          <div className="g2 mt">
            <div className="card">
              <h3>Monthly Completion Trend</h3>

              <p className="muted sm">
                Completed tasks across the selected and
                previous five months.
              </p>

              {trend.every((item) => item.total === 0) ? (
                <p
                  className="muted"
                  style={{ marginTop: 25 }}
                >
                  No completion records available for this period.
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'end',
                    justifyContent: 'space-around',
                    gap: 12,
                    height: 190,
                    marginTop: 25,
                    paddingBottom: 25,
                    borderBottom: '1px solid #e9e2fa',
                  }}
                >
                  {trend.map((item) => (
                    <div
                      key={item.key}
                      style={{
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'end',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <strong className="sm">
                        {item.total}
                      </strong>

                      <div
                        title={`${item.total} completed tasks`}
                        style={{
                          width: '75%',
                          maxWidth: 42,
                          height: `${
                            item.total
                              ? Math.max(
                                  5,
                                  (item.total / maxTrend) * 115
                                )
                              : 3
                          }px`,
                          background:
                            'linear-gradient(180deg, #cc25d0, #7135f5)',
                          borderRadius:
                            '7px 7px 2px 2px',
                          opacity: item.total ? 1 : 0.2,
                        }}
                      />

                      <span className="muted sm">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3>Performance Summary</h3>

              <p className="muted sm">
                Evaluation and completion overview for{' '}
                {formatMonth(selectedMonth)}.
              </p>

              <div style={{ marginTop: 22 }}>
                <div
                  className="row sb"
                  style={{ marginBottom: 10 }}
                >
                  <span>Completed tasks</span>
                  <strong>{stats.completedTasks}</strong>
                </div>

                <div
                  className="row sb"
                  style={{ marginBottom: 10 }}
                >
                  <span>Employees contributing</span>
                  <strong>{stats.completedEmployees}</strong>
                </div>

                <div
                  className="row sb"
                  style={{ marginBottom: 10 }}
                >
                  <span>Total evaluations</span>
                  <strong>{stats.totalEvaluations}</strong>
                </div>

                <div className="row sb">
                  <span>Average evaluation rating</span>

                  <strong>
                    {stats.totalEvaluations
                      ? `${formatNumber(stats.averageRating)} / 5`
                      : 'N/A'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* EMPLOYEE PERFORMANCE RANKING */}
          <div className="card mt">
            <div className="row sb wrap">
              <div>
                <h3>Employee Performance Ranking</h3>

                <p className="muted sm">
                  Ranked by completed tasks during{' '}
                  {formatMonth(selectedMonth)}.
                </p>
              </div>

              <span className="chip">
                {ranking.length} employees
              </span>
            </div>

            {ranking.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '45px 15px',
                }}
              >
                <h3>No completion records yet</h3>

                <p className="muted" style={{ marginTop: 8 }}>
                  There are no tasks with recorded completion
                  timestamps for {formatMonth(selectedMonth)}.
                  New task completions will appear here
                  automatically.
                </p>
              </div>
            ) : (
              <div
                className="tw"
                style={{ marginTop: 15 }}
              >
                <table>
                  <thead>
                    <tr className="hd">
                      <th>Rank</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Completed</th>
                      <th>Progress</th>
                      <th>Rating</th>
                      <th>Evaluations</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ranking.map((employee, index) => (
                      <tr key={employee.employee_id}>
                        <td data-l="Rank">
                          <strong>#{index + 1}</strong>
                        </td>

                        <td data-l="Employee">
                          <strong>{employee.full_name}</strong>
                        </td>

                        <td data-l="Department">
                          {employee.department || '—'}
                        </td>

                        <td data-l="Completed">
                          <span className="chip ok">
                            {employee.completed_tasks}
                          </span>
                        </td>

                        <td data-l="Progress">
                          {formatNumber(employee.average_progress)}%
                        </td>

                        <td data-l="Rating">
                          {Number(employee.total_evaluations) > 0
                            ? `${formatNumber(employee.average_rating)} / 5`
                            : 'Not rated'}
                        </td>

                        <td data-l="Evaluations">
                          {employee.total_evaluations}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
