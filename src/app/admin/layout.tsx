import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, Tags, ShoppingCart, Users, Ticket, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/"); 
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: Tags },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Coupons", href: "/admin/coupons", icon: Ticket },
    { name: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <span className="text-xl font-bold tracking-wider">BLUE ناز Admin</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Icon className="w-5 h-5 text-gray-300" />
                <span className="font-medium text-gray-100">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
          <div className="md:hidden font-bold text-primary">BLUE ناز Admin</div>
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-gray-800">Welcome back, {profile.name || 'Admin'}</h1>
          </div>
          <div>
            <Link href="/" className="text-sm text-primary font-semibold hover:underline bg-blue-50 px-3 py-2 rounded">
              Storefront
            </Link>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
