import { Outlet } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1A1A1A]">
      <Navbar />
      <main className="pt-[4.5rem]">
        <Outlet />
      </main>
    </div>
  )
}
