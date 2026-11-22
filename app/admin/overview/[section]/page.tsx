import { notFound } from 'next/navigation';
import { dashboardSections } from '../../../_portal/dashboard-sections';
import Dashboard from './dashboard';

export default async function OverviewPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const dashboard = dashboardSections.find(item => item.slug === section);
  if (!dashboard) notFound();

  return <Dashboard key={dashboard.slug} section={dashboard} />;
}
