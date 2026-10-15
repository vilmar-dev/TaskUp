'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [role, setRole] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const tm = useRef();

  useEffect(() => {
    try {
      const r = sessionStorage.getItem('hw-role');
      if (r === 'employee' || r === 'supervisor') setRole(r);
    } catch (e) {}
    setLoaded(true);
  }, []);

  const signIn = useCallback((r) => {
    try { sessionStorage.setItem('hw-role', r); } catch (e) {}
    setRole(r);
  }, []);

  const signOut = useCallback(() => {
    try { sessionStorage.removeItem('hw-role'); } catch (e) {}
    setRole(null);
  }, []);

  const toast = useCallback((m) => {
    setMsg(m);
    setShow(true);
    clearTimeout(tm.current);
    tm.current = setTimeout(() => setShow(false), 2600);
  }, []);

  return (
    <Ctx.Provider value={{ role, loaded, signIn, signOut, toast }}>
      {children}
      <div id="toast" role="status" aria-live="polite" className={show ? 'show' : ''}>
        {msg}
      </div>
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
