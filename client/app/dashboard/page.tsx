import { DashboardPage } from '../../components/pages/DashboardPage';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export const metadata = {
  title: 'Live Dashboard',
};

export default function DashboardRoute() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
