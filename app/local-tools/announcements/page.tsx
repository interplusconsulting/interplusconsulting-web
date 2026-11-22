import { notFound } from 'next/navigation';
import AdminAnnouncements from './admin-announcements';
import './admin.css';

export default function AdminAnnouncementsPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <AdminAnnouncements />;
}
