import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AppProvider } from './lib/store';
import { AuthProvider } from './lib/auth';
import RevenuecentraExtractor from './pages/RevenuecentraExtractor';
import JobDetail from './pages/JobDetail';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <div className="min-h-screen bg-canvas text-ink antialiased">
            <Routes>
              <Route path="/" element={<RevenuecentraExtractor />} />
              <Route path="/extraction" element={<RevenuecentraExtractor />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
