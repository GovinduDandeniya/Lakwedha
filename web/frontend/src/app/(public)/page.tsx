import { redirect } from 'next/navigation';

// Landing page belongs to another team member.
// Redirect root to the pharmacy login until they implement it.
export default function Home() {
  redirect('/login');
}
