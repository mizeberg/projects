import { personalityQuizzes } from '@/lib/content'
import LabClient from './LabClient'

export const metadata = {
  title: 'The Personality Lab — Internet Arcade',
  description: 'Playful, original personality quizzes. Discover your curiosity style with shareable result cards. Not a clinical assessment — just fun, thoughtful play.',
}

export default function Page() {
  return <LabClient quizzes={personalityQuizzes} />
}
