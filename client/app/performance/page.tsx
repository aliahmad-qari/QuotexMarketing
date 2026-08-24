import { PerformancePage } from '../../components/pages/PerformancePage';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export const metadata = {
  title: 'Performance',
};

export default function PerformanceRoute() {
  return (
    <ProtectedRoute>
      <PerformancePage />
    </ProtectedRoute>
  );
}
