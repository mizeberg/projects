'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
export default function AnalyticsBeacon() {
  const pathname = usePathname()
  useEffect(()=>{
    fetch('/api/analytics', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event: 'view', experienceId: pathname.split('/')[1] || 'home' }) }).catch(()=>{})
  }, [pathname])
  return null
}
