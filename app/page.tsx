import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BudgetPlanner from '@/components/BudgetPlanner';

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <BudgetPlanner />;
}
