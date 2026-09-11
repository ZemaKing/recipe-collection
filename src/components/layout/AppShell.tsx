import { Outlet } from 'react-router-dom'
import BottomTabBar from './BottomTabBar'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function AppShell() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      <BottomTabBar />
    </div>
  )
}

export default AppShell
