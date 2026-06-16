import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Conversations from './pages/Conversations';
import Bookings from './pages/Bookings';
import Content from './pages/Content';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page - Standalone */}
        <Route path="/" element={<Landing />} />

        {/* Dashboard Pages - Wrapped with Sidebar Layout */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/leads"
          element={
            <Layout>
              <Leads />
            </Layout>
          }
        />
        <Route
          path="/conversations"
          element={
            <Layout>
              <Conversations />
            </Layout>
          }
        />
        <Route
          path="/bookings"
          element={
            <Layout>
              <Bookings />
            </Layout>
          }
        />
        <Route
          path="/content"
          element={
            <Layout>
              <Content />
            </Layout>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
