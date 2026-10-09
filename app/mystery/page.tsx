import { mysteries } from '@/lib/content'
import MysteryClient from './MysteryClient'

export const metadata = {
  title: 'The Mystery Room — Internet Arcade',
  description: 'Original deduction cases. Evidence, timelines, progressive hints, logically consistent solutions. Playable in 12-25 minutes.',
}

export default function Page() {
  return <MysteryClient mysteries={mysteries} />
}
