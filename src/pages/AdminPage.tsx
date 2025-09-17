import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminDashboard } from '@/components/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';

const AdminPage = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect unauthenticated users to auth page
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render dashboard if user is not authenticated
  if (!user) {
    return null;
  }

  return <AdminDashboard />;
};

export default AdminPage;