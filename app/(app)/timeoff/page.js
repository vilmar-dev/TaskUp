
'use client';

import { useEffect, useState } from 'react';
import { Banner } from '@/components/ui';
import { createClient } from '@/lib/supabase';

export default function TimeOff() {
  const [supabase] = useState(() => createClient());

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function loadRequests() {
    setLoading(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setMessage('Please sign in again.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function submitRequest(e) {
    e.preventDefault();
    setMessage('');

    if (!startDate || !endDate || !reason.trim()) {
      setMessage('Please complete all fields.');
      return;
    }

    if (endDate < startDate) {
      setMessage('End date cannot be earlier than start date.');
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('Please sign in again.');

      const { error } = await supabase
        .from('time_off_requests')
        .insert({
          employee_id: user.id,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
          status: 'pending',
        });

      if (error) throw error;

      setMessage('Your time-off request was submitted successfully.');

      setStartDate('');
      setEndDate('');
      setReason('');

      await loadRequests();

    } catch (error) {
      setMessage(error.message || 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  }

  const statusStyle = {
    pending: { bg: '#fff0dc', color: '#bd7914' },
    approved: { bg: '#dff4eb', color: '#079968' },
    rejected: { bg: '#ffe4e8', color: '#d13c61' },
  };

  const card = {
    background: '#fff',
    border: '1px solid #eee5ff',
    borderRadius: 16,
    padding: 22,
    boxShadow: '0 8px 25px rgba(92,49,180,0.06)',
  };

  const field = {
    width: '100%',
    padding: 12,
    border: '1px solid #e6dcff',
    borderRadius: 9,
    marginTop: 7,
    boxSizing: 'border-box',
    fontSize: 14,
  };

  return (
    <>
      <Banner
        title="Time Off"
        sub="Request leave and monitor your approval status."
      />

      <div style={{
        padding: '20px 24px 35px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        gap: 20,
      }}>

        {/* REQUEST FORM */}
        <section style={card}>
          <h3 style={{ color: '#29204f', marginTop: 0 }}>
            Request Time Off
          </h3>

          <p style={{ color: '#81769c', fontSize: 13 }}>
            Submit your requested leave dates for supervisor approval.
          </p>

          <form onSubmit={submitRequest}>

            <label style={{ display: 'block', marginTop: 18, fontSize: 13 }}>
              Start Date
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={field}
                required
              />
            </label>

            <label style={{ display: 'block', marginTop: 16, fontSize: 13 }}>
              End Date
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)}
                style={field}
                required
              />
            </label>

            <label style={{ display: 'block', marginTop: 16, fontSize: 13 }}>
              Reason for Leave
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Enter your reason for requesting time off..."
                rows={4}
                style={{
                  ...field,
                  resize: 'vertical',
                }}
                required
              />
            </label>

            {message && (
              <p style={{
                color: message.includes('successfully')
                  ? '#079968'
                  : '#d13c61',
                fontSize: 13,
                marginTop: 15,
              }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 20,
                width: '100%',
                padding: 13,
                border: 'none',
                borderRadius: 10,
                background: '#7837e9',
                color: '#fff',
                fontWeight: 700,
                cursor: submitting ? 'wait' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Time-Off Request'}
            </button>

          </form>
        </section>

        {/* REQUEST HISTORY */}
        <section style={card}>
          <h3 style={{ color: '#29204f', marginTop: 0 }}>
            My Leave Requests
          </h3>

          <p style={{ color: '#81769c', fontSize: 13 }}>
            Track the status of your submitted requests.
          </p>

          {loading ? (
            <p>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p style={{
              color: '#81769c',
              textAlign: 'center',
              padding: 35,
              fontSize: 13,
            }}>
              No time-off requests yet.
            </p>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 20,
            }}>
              {requests.map(request => {
                const status = statusStyle[request.status];

                return (
                  <div
                    key={request.id}
                    style={{
                      padding: 15,
                      border: '1px solid #eee5ff',
                      borderRadius: 12,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}>
                      <strong style={{ color: '#29204f', fontSize: 13 }}>
                        {request.start_date} – {request.end_date}
                      </strong>

                      <span style={{
                        background: status?.bg || '#eee',
                        color: status?.color || '#555',
                        padding: '5px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                      }}>
                        {request.status}
                      </span>
                    </div>

                    <p style={{
                      color: '#81769c',
                      fontSize: 13,
                      marginBottom: 0,
                    }}>
                      {request.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </>
  );
}
