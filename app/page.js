'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { useApp } from '@/components/Providers';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, toast } = useApp();
  const [role, setRole] = useState('employee');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
const login = async () => {
  if (!email.trim() || !password) {
    toast('Please enter your email and password');
    return;
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    toast(error.message);
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, approval_status')
    .eq('id', data.user.id)
    .single();
    
if (profileError || !profile) {
  await supabase.auth.signOut();
  toast('Unable to load your TaskUp profile');
  return;
}

  if (profile.approval_status !== 'approved') {
    await supabase.auth.signOut();

    if (profile.approval_status === 'pending') {
      toast('Your account is still waiting for supervisor approval');
    } else {
      toast('Your account has been rejected');
    }

    return;
  }

  if (profile.role !== role) {
    await supabase.auth.signOut();
    toast(`This account is registered as ${profile.role}`);
    return;
  }

  signIn(profile.role);

  router.push(
    profile.role === 'supervisor' ? '/supdash' : '/dashboard'
  );
};

  return (
    <section id="login">
      <i className="orb o1" />
      <i className="orb o2" />
      <div className="gcard">
        <div className="avatar">
          <Icon n="user" />
        </div>
        <h2>Welcome back</h2>
        <p>Log in to manage your hybrid work tasks.</p>
        <div className="seg" style={{ margin: '20px 0 26px' }}>
          <button className={role === 'employee' ? 'on' : ''} onClick={() => setRole('employee')}>
            Employee
          </button>
          <button className={role === 'supervisor' ? 'on' : ''} onClick={() => setRole('supervisor')}>
            Supervisor
          </button>
        </div>
        <label className="ul">
          <span>
            <Icon n="mail" />
          </span>
          <input
            type="email"
                  placeholder={role === 'employee' ? 'Employee email' : 'Supervisor email'}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="ul">
          <span>
            <Icon n="lock" />
          </span>
          <input type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} />
        </label>
        <div className="row sb">
          <label className="chk">
            <input type="checkbox" defaultChecked />
            Remember me
          </label>
          <button className="btn lnk" onClick={() => toast('Password reset link sent')}>
            Forgot password?
          </button>
        </div>
        <button className="btn p gobtn" onClick={login}>
          Login
        </button>
        <p className="sm" style={{ textAlign: 'center', margin: '16px 0 0', color: '#e4dcff' }}>
          No account yet?{' '}
          <button
            className="btn lnk"
            style={{ display: 'inline', color: '#fff', textDecoration: 'underline' }}
            onClick={() => toast('Sign-up form opens here')}
          >
            Create an account
          </button>
        </p>
      </div>
    </section>
  );
}
