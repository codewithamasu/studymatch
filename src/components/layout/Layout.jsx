import { Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg-dark">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}
