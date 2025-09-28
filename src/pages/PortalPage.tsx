import { usePortalAuth } from '@/hooks/usePortalAuth';
import { PortalLogin } from '@/components/portal/PortalLogin';
import { PortalDashboard } from '@/components/portal/PortalDashboard';

const PortalPage = () => {
  const { portalUser, loading } = usePortalAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (!portalUser) {
    return <PortalLogin />;
  }

  return <PortalDashboard />;
};

export default PortalPage;