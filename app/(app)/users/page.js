
'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { useApp } from '@/components/Providers';
import { Banner } from '@/components/ui';
import { createClient } from '@/lib/supabase';

export default function Users() {
  const { toast } = useApp();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    department: '',
  });

  // LOAD TEAM ACCOUNTS
  async function loadUsers() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, full_name, department, role, approval_status, requested_role'
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load users error:', error);
      toast('Unable to load team accounts');
    } else {
      setUsers(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // OPEN EDIT FORM
  function openEdit(user) {
    if (user.role !== 'employee') {
      toast('This form is for editing employees only');
      return;
    }

    setEditingUser(user);

    setForm({
      full_name: user.full_name || '',
      department: user.department || '',
    });
  }

  // CLOSE EDIT FORM
  function closeEdit() {
    if (saving) return;

    setEditingUser(null);

    setForm({
      full_name: '',
      department: '',
    });
  }

  // SAVE EMPLOYEE CHANGES
  async function saveEmployee(e) {
    e.preventDefault();

    if (!editingUser || saving) return;

    if (!form.full_name.trim()) {
      alert('Please enter the employee name.');
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const { error } = await supabase.rpc(
      'supervisor_edit_employee',
      {
        target_user_id: editingUser.id,
        new_full_name: form.full_name.trim(),
        new_department: form.department.trim(),
      }
    );

    if (error) {
      console.error('Edit employee error:', error);
      alert(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditingUser(null);

    toast('Employee information updated successfully');

    await loadUsers();
  }

  return (
    <>
      <Banner
        back
        title="Manage team"
        sub="Employee accounts, roles, and status."
        action={
          <button
            className="btn p"
            onClick={() =>
              toast('Add-user functionality will be connected later')
            }
          >
            <Icon n="plus" />
            Add user
          </button>
        }
      />

      {/* EDIT EMPLOYEE FORM */}
      {editingUser && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="row sb wrap">
            <h3 style={{ margin: 0 }}>
              Edit employee
            </h3>

            <button
              className="btn"
              type="button"
              onClick={closeEdit}
              disabled={saving}
            >
              Cancel
            </button>
          </div>

          <p className="muted sm" style={{ marginTop: 12 }}>
            Update the employee's information below.
          </p>

          <form
            onSubmit={saveEmployee}
            style={{
              maxWidth: 650,
              marginTop: 20,
            }}
          >
            <div className="f">
              <label>
                Full name
              </label>

              <input
                className="in"
                type="text"
                value={form.full_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    full_name: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="f">
              <label>
                Department
              </label>

              <input
                className="in"
                type="text"
                placeholder="Enter department"
                value={form.department}
                onChange={(e) =>
                  setForm({
                    ...form,
                    department: e.target.value,
                  })
                }
              />
            </div>

            <div className="f">
              <label>
                Role
              </label>

              <input
                className="in"
                type="text"
                value="Employee"
                disabled
              />
            </div>

            <div className="f">
              <label>
                Account status
              </label>

              <input
                className="in"
                type="text"
                value={editingUser.approval_status}
                disabled
              />
            </div>

            <button
              className="btn p"
              type="submit"
              disabled={saving}
              style={{ marginTop: 15 }}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>
      )}

      {/* TEAM TABLE */}
      <div className="card">
        <div className="tw">
          <table>
            <tbody>
              <tr className="hd">
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>

              {loading ? (
                <tr>
                  <td colSpan={4}>
                    Loading team accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    No team accounts found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td data-l="Name">
                      <div className="row">
                        <span className="av">
                          {(u.full_name || 'U')
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>

                        <div>
                          <div>
                            {u.full_name || 'Unnamed User'}
                          </div>

                          {u.department && (
                            <div className="sm muted">
                              {u.department}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td data-l="Role">
                      {u.role === 'supervisor'
                        ? 'Supervisor'
                        : 'Employee'}
                    </td>

                    <td data-l="Status">
                      <span
                        className={`chip ${
                          u.approval_status === 'approved'
                            ? 'ok'
                            : ''
                        }`}
                      >
                        {u.approval_status === 'approved'
                          ? 'Approved'
                          : u.approval_status === 'pending'
                          ? 'Pending'
                          : 'Rejected'}
                      </span>
                    </td>

                    <td data-l="">
                      {u.role === 'employee' ? (
                        <button
                          className="btn"
                          onClick={() => openEdit(u)}
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="muted sm">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
