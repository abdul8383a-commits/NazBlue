import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OrderList from '@/components/OrderList';

export const dynamic = 'force-dynamic';

export default async function Account() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, product_variants(size, color, products(name)))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-[70vh]">
      <h1 className="text-3xl font-bold text-primary mb-8">My Account</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="p-6 border border-primary/20 dark:border-white/20 rounded-lg shadow-sm bg-white dark:bg-transparent">
            <h2 className="text-xl font-semibold mb-4 text-primary dark:text-white">Profile Info</h2>
            <div className="space-y-3 text-gray-900 dark:text-white">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium break-all">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium">
                  {profile?.first_name || profile?.last_name 
                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                <p className="font-medium">{profile?.phone || 'Not provided'}</p>
              </div>
              <a href="/account/edit" className="mt-4 w-full block text-center bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-800 dark:text-white py-2 rounded text-sm font-semibold transition-colors">
                Edit Profile
              </a>
              {profile?.role === 'admin' && (
                <a href="/admin" className="block text-center mt-2 w-full bg-primary hover:bg-primary/90 text-white py-2 rounded text-sm font-semibold transition-colors">
                  Go to Admin Dashboard
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="p-6 border border-primary/20 dark:border-white/20 rounded-lg shadow-sm bg-white dark:bg-transparent">
            <h2 className="text-xl font-semibold mb-6 text-primary dark:text-white">Order History</h2>
            <OrderList orders={orders || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
