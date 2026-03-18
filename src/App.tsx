/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useStore } from './store';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Calendar } from './pages/Calendar';
import { Workout } from './pages/Workout';
import { Progress } from './pages/Progress';
import { Profile } from './pages/Profile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
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
