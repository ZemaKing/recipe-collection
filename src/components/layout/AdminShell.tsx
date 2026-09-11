import { Outlet } from 'react-router-dom'
import AdminBottomTabBar from './AdminBottomTabBar'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'

function AdminShell() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <AdminSidebar />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <AdminTopbar />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      <AdminBottomTabBar />
    </div>
  )
}

export default AdminShell
