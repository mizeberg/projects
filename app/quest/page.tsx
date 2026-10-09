import { getDailyQuest } from '@/lib/content'
import QuestClient from './QuestClient'

export const metadata = {
  title: 'Daily Quest — Internet Arcade',
  description: 'A logic puzzle, creative challenge, curiosity question, experiment, and bonus discovery — fresh every day. Streaks optional, never punitive.',
}

export default function Page() {
  const quest = getDailyQuest(new Date())
  return <QuestClient quest={quest} />
}
