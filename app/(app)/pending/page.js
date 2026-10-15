
'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { useApp } from '@/components/Providers';
import { Banner } from '@/components/ui';
import { createClient } from '@/lib/supabase';

export default function PendingAccounts() {
  const { toast } = useApp();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Load pending accounts from Supabase
  useEffect(() => {
    let active = true;

    async function loadPendingAccounts() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, full_name, requested_role, approval_status, created_at'
        )
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (!active) return;

      if (error) {
        console.error('Load pending accounts error:', error);
        toast('Unable to load pending accounts');
        setAccounts([]);
      } else {
        setAccounts(data || []);
      }

      setLoading(false);
    }

    loadPendingAccounts();

    return () => {
      active = false;
    };
  }, []);

  // Approve or reject an account
  async function handleReview(account, action) {
    if (processingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${account.full_name || 'this user'}?`
    );

    if (!confirmed) return;

    setProcessingId(account.id);

    const supabase = createClient();

    const functionName =
      action === 'approve'
        ? 'approve_account'
        : 'reject_account';

    const { error } = await supabase.rpc(functionName, {
      target_user_id: account.id,
    });

    if (error) {
      console.error(`${action} account error:`, error);
      toast(error.message);
      setProcessingId(null);
      return;
    }

    // Remove reviewed account from pending list
    setAccounts((previous) =>
      previous.filter((item) => item.id !== account.id)
    );

    toast(
      action === 'approve'
        ? 'Account approved successfully'
        : 'Account rejected successfully'
    );

    setProcessingId(null);
  }

  return (
    <>
      <Banner
        back
        title="Pending accounts"
        sub="Review new sign-ups before granting access."
      />

      <div className="card">
        {loading ? (
          <p>Loading pending accounts...</p>
        ) : accounts.length === 0 ? (
          <p>No pending accounts.</p>
        ) : (
          <div className="tw">
            <table>
              <tbody>
                <tr className="hd">
                  <th>Name</th>
                  <th>Requested role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>

                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td data-l="Name">
                      <div className="row">
                        <span className="av">
                          {(account.full_name || 'U')
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>

                        {account.full_name || 'Unnamed User'}
                      </div>
                    </td>

                    <td data-l="Requested role">
                      {account.requested_role === 'supervisor'
                        ? 'Supervisor'
                        : 'Employee'}
                    </td>

                    <td data-l="Status">
                      <span className="chip">Pending</span>
                    </td>

                    <td data-l="Actions">
                      <div className="row">
                        <button
                          className="btn p"
                          disabled={processingId !== null}
                          onClick={() =>
                            handleReview(account, 'approve')
                          }
                        >
                          <Icon n="check" />
                          {processingId === account.id
                            ? 'Processing...'
                            : 'Approve'}
                        </button>

                        <button
                          className="btn"
                          disabled={processingId !== null}
                          onClick={() =>
                            handleReview(account, 'reject')
                          }
                        >
                          {processingId === account.id
                            ? 'Processing...'
                            : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
