
'use client';

import { useEffect, useState } from 'react';
import { Banner } from '@/components/ui';
import { createClient } from '@/lib/supabase';

export default function SupervisorTimeOff() {
  const [supabase] = useState(() => createClient());

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('pending');

  // LOAD LEAVE REQUESTS AND EMPLOYEE NAMES
  async function loadRequests() {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('Please sign in again.');

      // Fetch leave requests
      const { data, error: fetchError } = await supabase
        .from('time_off_requests')
        .select(`
          id,
          employee_id,
          start_date,
          end_date,
          reason,
          status,
          created_at,
          reviewed_at
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Get unique employee IDs
      const employeeIds = [
        ...new Set((data || []).map(request => request.employee_id))
      ];

      let profiles = [];

      // Fetch employee names from profiles
      if (employeeIds.length > 0) {
        const { data: profileData, error: profileError } =
          await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', employeeIds);

        if (profileError) throw profileError;

        profiles = profileData || [];
      }

      // Create employee ID to name mapping
      const profileMap = Object.fromEntries(
        profiles.map(profile => [
          profile.id,
          profile.full_name
        ])
      );

      // Attach employee names to leave requests
      const requestsWithNames = (data || []).map(request => ({
        ...request,
        employee_name:
          profileMap[request.employee_id] || 'Unknown Employee'
      }));

      setRequests(requestsWithNames);

    } catch (err) {
      setError(err.message || 'Unable to load requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  // APPROVE OR REJECT REQUEST
  async function reviewRequest(requestId, decision) {
    const action = decision === 'approved' ? 'approve' : 'reject';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this time-off request?`
    );

    if (!confirmed) return;

    setProcessing(requestId);
    setError('');
    setMessage('');

    try {
      const { error: reviewError } = await supabase.rpc(
        'review_time_off',
        {
          target_request_id: requestId,
          new_status: decision,
        }
      );

      if (reviewError) throw reviewError;

      setMessage(
        `Time-off request successfully ${decision}.`
      );

      await loadRequests();

    } catch (err) {
      setError(
        err.message || 'Unable to process the request.'
      );
    } finally {
      setProcessing(null);
    }
  }

  // FILTER REQUESTS
  const filteredRequests = requests.filter(
    request => filter === 'all' || request.status === filter
  );

  // SUMMARY COUNTS
  const pendingCount = requests.filter(
    r => r.status === 'pending'
  ).length;

  const approvedCount = requests.filter(
    r => r.status === 'approved'
  ).length;

  const rejectedCount = requests.filter(
    r => r.status === 'rejected'
  ).length;

  // CARD DESIGN
  const card = {
    background: '#fff',
    border: '1px solid #eee5ff',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 8px 25px rgba(92,49,180,0.05)',
  };

  // STATUS COLORS
  const statusColors = {
    pending: { bg: '#fff0dc', color: '#bd7914' },
    approved: { bg: '#dff4eb', color: '#079968' },
    rejected: { bg: '#ffe4e8', color: '#d13c61' },
  };

  // DATE FORMAT
  function formatDate(value) {
    return new Date(value + 'T00:00:00').toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  }

  return (
    <>
      <Banner
        title="Time Off Management"
        sub="Review, approve, and manage employee leave requests."
      />

      <div style={{
        padding: '20px 24px 35px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>

        {/* SUMMARY */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 15,
        }}>
          {[
            {
              label: 'Pending Requests',
              value: pendingCount,
              color: '#bd7914'
            },
            {
              label: 'Approved Requests',
              value: approvedCount,
              color: '#079968'
            },
            {
              label: 'Rejected Requests',
              value: rejectedCount,
              color: '#d13c61'
            },
          ].map(item => (
            <div key={item.label} style={card}>
              <p style={{
                color: '#81769c',
                fontSize: 13,
                margin: 0,
              }}>
                {item.label}
              </p>

              <h2 style={{
                color: item.color,
                fontSize: 30,
                margin: '10px 0 0',
              }}>
                {item.value}
              </h2>
            </div>
          ))}
        </div>

        {/* REQUESTS */}
        <div style={card}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 15,
            marginBottom: 20,
          }}>
            <div>
              <h3 style={{
                margin: 0,
                color: '#29204f',
              }}>
                Employee Leave Requests
              </h3>

              <p style={{
                margin: '6px 0 0',
                color: '#81769c',
                fontSize: 13,
              }}>
                Review employee submissions and make decisions.
              </p>
            </div>

            <button
              onClick={loadRequests}
              disabled={loading}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #e6dcff',
                background: '#fff',
                color: '#7136d9',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ↻ Refresh
            </button>
          </div>

          {/* FILTERS */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 20,
          }}>
            {[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'all', label: 'All Requests' },
            ].map(item => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                style={{
                  padding: '9px 15px',
                  borderRadius: 20,
                  border: '1px solid #e6dcff',
                  background: filter === item.value
                    ? '#7136d9'
                    : '#fff',
                  color: filter === item.value
                    ? '#fff'
                    : '#81769c',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div style={{
              padding: 14,
              background: '#fff0f0',
              color: '#d13c61',
              borderRadius: 10,
              marginBottom: 15,
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {message && (
            <div style={{
              padding: 14,
              background: '#e8f8ef',
              color: '#079968',
              borderRadius: 10,
              marginBottom: 15,
              fontSize: 13,
            }}>
              {message}
            </div>
          )}

          {/* REQUEST LIST */}
          {loading ? (
            <p style={{ color: '#81769c' }}>
              Loading requests...
            </p>
          ) : filteredRequests.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              color: '#81769c',
            }}>
              No {filter === 'all' ? '' : filter} requests found.
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
              {filteredRequests.map(request => {
                const colors =
                  statusColors[request.status] ||
                  statusColors.pending;

                return (
                  <div
                    key={request.id}
                    style={{
                      border: '1px solid #eee5ff',
                      borderRadius: 13,
                      padding: 17,
                    }}
                  >
                    {/* EMPLOYEE NAME AND STATUS */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                    }}>
                      <strong style={{
                        color: '#29204f',
                        fontSize: 15,
                      }}>
                        {request.employee_name}
                      </strong>

                      <span style={{
                        padding: '5px 12px',
                        borderRadius: 20,
                        background: colors.bg,
                        color: colors.color,
                        fontWeight: 700,
                        fontSize: 11,
                        textTransform: 'capitalize',
                      }}>
                        {request.status}
                      </span>
                    </div>

                    {/* REQUEST DETAILS */}
                    <div style={{
                      marginTop: 15,
                      color: '#81769c',
                      fontSize: 13,
                      lineHeight: 1.8,
                    }}>
                      <div>
                        <strong>Start:</strong>{' '}
                        {formatDate(request.start_date)}
                      </div>

                      <div>
                        <strong>End:</strong>{' '}
                        {formatDate(request.end_date)}
                      </div>

                      <div>
                        <strong>Reason:</strong>{' '}
                        {request.reason}
                      </div>

                      <div>
                        <strong>Submitted:</strong>{' '}
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* APPROVE AND REJECT */}
                    {request.status === 'pending' && (
                      <div style={{
                        display: 'flex',
                        gap: 10,
                        flexWrap: 'wrap',
                        marginTop: 17,
                      }}>
                        <button
                          disabled={processing !== null}
                          onClick={() =>
                            reviewRequest(request.id, 'approved')
                          }
                          style={{
                            padding: '10px 18px',
                            background: '#079968',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 9,
                            fontWeight: 700,
                            cursor: 'pointer',
                            opacity: processing !== null ? 0.6 : 1,
                          }}
                        >
                          {processing === request.id
                            ? 'Processing...'
                            : '✓ Approve'}
                        </button>

                        <button
                          disabled={processing !== null}
                          onClick={() =>
                            reviewRequest(request.id, 'rejected')
                          }
                          style={{
                            padding: '10px 18px',
                            background: '#d13c61',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 9,
                            fontWeight: 700,
                            cursor: 'pointer',
                            opacity: processing !== null ? 0.6 : 1,
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
