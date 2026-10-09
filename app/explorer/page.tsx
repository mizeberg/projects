import { whatIfScenarios } from '@/lib/content'
import ExplorerClient from './ExplorerClient'

export const metadata = {
  title: 'What If? Explorer — Internet Arcade',
  description: 'Interactive hypothetical worlds. Science, speculation, branching outcomes. What if Earth had two moons? What if the internet disappeared?',
}

export default function Page() {
  return <ExplorerClient scenarios={whatIfScenarios} />
}
