/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useStore } from './store';
import { supabase } from './lib/supabase';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Calendar } from './pages/Calendar';
import { Workout } from './pages/Workout';
import { Progress } from './pages/Progress';
import { Profile } from './pages/Profile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  const isInitialized = useStore((state) => state.isInitialized);
  if (!isInitialized) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const loadUserData = useStore((state) => state.loadUserData);
  const logout = useStore((state) => state.logout);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user.id, session.user.email!);
      } else {
        useStore.setState({ isInitialized: true });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserData(session.user.id, session.user.email!);
      } else {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
