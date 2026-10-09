// Structured content schemas for all experiences
export type ExperienceMeta = {
  id: string
  slug: string
  title: string
  description: string
  category: 'Think'|'Create'|'Discover'|'Solve'|'Imagine'|'Challenge'
  difficulty?: 'Easy'|'Medium'|'Hard'
  estMinutes: number
  isPremium: boolean
  color: string
  icon: string
}

// ========= PERSONALITY LAB =========
export type QuizQuestion = {
  id: string
  prompt: string
  options: { id: string; label: string; traits: Record<string, number> }[]
}
export type PersonalityQuiz = {
  id: string
  title: string
  description: string
  color?: string
  questions: QuizQuestion[]
  results: { id: string; title: string; tagline: string; description: string; strengths: string[]; preferences: string[]; recommendations: string[]; color: string }[]
}

export const personalityQuizzes: PersonalityQuiz[] = [
  {
    id: 'curiosity-compass',
    title: 'The Curiosity Compass',
    description: 'What kind of explorer are you? Discover your curiosity style.',
    color: '#7c5cff',
    questions: [
      { id: 'q1', prompt: 'You find an unmarked door in your building. You...', options: [
        { id: 'a', label: 'Open it immediately — mysteries are invitations', traits: { explorer: 3, social: 1 } },
        { id: 'b', label: 'Research the building history first', traits: { analyst: 3, explorer: 1 } },
        { id: 'c', label: 'Invite friends to open it together', traits: { social: 3, creator: 1 } },
        { id: 'd', label: 'Sketch what might be behind it', traits: { creator: 3, analyst: 1 } },
      ]},
      { id: 'q2', prompt: 'Your ideal weekend project?', options: [
        { id: 'a', label: 'Build something with your hands', traits: { creator: 3, explorer: 1 } },
        { id: 'b', label: 'Deep dive into a rabbit hole topic', traits: { analyst: 3 } },
        { id: 'c', label: 'Host a dinner for interesting strangers', traits: { social: 3 } },
        { id: 'd', label: 'Take a train with no destination', traits: { explorer: 3, social: 1 } },
      ]},
      { id: 'q3', prompt: 'A friend asks for advice. You first...', options: [
        { id: 'a', label: 'Ask how they feel about it', traits: { social: 3, creator: 1 } },
        { id: 'b', label: 'Map out options and tradeoffs', traits: { analyst: 3 } },
        { id: 'c', label: 'Share a story or analogy', traits: { creator: 3, social: 1 } },
        { id: 'd', label: 'Suggest an experiment to try', traits: { explorer: 3, analyst: 1 } },
      ]},
      { id: 'q4', prompt: 'You learn best when...', options: [
        { id: 'a', label: 'You can tinker and try', traits: { explorer: 2, creator: 2 } },
        { id: 'b', label: 'You understand the system behind it', traits: { analyst: 3 } },
        { id: 'c', label: 'You discuss it with others', traits: { social: 3 } },
        { id: 'd', label: 'You make it beautiful or funny', traits: { creator: 3 } },
      ]},
      { id: 'q5', prompt: 'What delights you most?', options: [
        { id: 'a', label: 'A surprising connection between unrelated ideas', traits: { analyst: 2, explorer: 2 } },
        { id: 'b', label: 'Making something that didn’t exist before', traits: { creator: 3 } },
        { id: 'c', label: 'A room full of laughter', traits: { social: 3 } },
        { id: 'd', label: 'Finding a hidden place no one knows', traits: { explorer: 3 } },
      ]},
    ],
    results: [
      { id: 'explorer', title: 'The Pathfinder', tagline: 'You chart territories others miss.', description: 'You’re driven by novelty and discovery. You connect dots across fields, love the first draft of anything, and feel alive when plans are loose. People follow you because you make the unknown feel playful.', strengths: ['Spotting fresh angles', 'Comfort with ambiguity', 'Quick experimentation'], preferences: ['Open-ended challenges', 'Travel and improvisation'], recommendations: ['Keep a curiosity journal', 'Try urban exploration photography', 'Learn via field notes, not textbooks'], color: '#00e5cc' },
      { id: 'analyst', title: 'The Pattern Keeper', tagline: 'You see the system inside the story.', description: 'You love understanding how things work. You notice structures, exceptions, and hidden rules. Friends come to you to make sense of chaos.', strengths: ['Systems thinking', 'Calm analysis', 'Finding clarity'], preferences: ['Deep dives', 'Puzzles with elegant solutions'], recommendations: ['Build a second brain with linked notes', 'Try logic puzzle design', 'Explore data storytelling'], color: '#7c5cff' },
      { id: 'creator', title: 'The Studio Alchemist', tagline: 'You turn feelings into forms.', description: 'You transform mood into making. Whether words, images, or spaces, you give invisible things a shape others can feel.', strengths: ['Imaginative synthesis', 'Aesthetic instinct', 'Narrative flair'], preferences: ['Blank pages and empty rooms', 'Collaborative jams'], recommendations: ['Daily 10-minute creative prompts', 'World-build a fictional city', 'Make a zine for one person'], color: '#ff4d6e' },
      { id: 'social', title: 'The Campfire', tagline: 'You make strangers into collaborators.', description: 'You energize groups, translate between people, and create belonging. Ideas grow faster around you.', strengths: ['Empathy & listening', 'Hosting & facilitation', 'Weaving networks'], preferences: ['Conversations over lectures', 'Co-creation'], recommendations: ['Host a salon night', 'Interview someone with a different life', 'Build community rituals'], color: '#ffb020' },
    ]
  },
  {
    id: 'creative-current',
    title: 'Your Creative Current',
    description: 'How does your imagination flow? Find your creative rhythm.',
    color: '#ff4d6e',
    questions: [
      { id: 'q1', prompt: 'When stuck, you...', options: [
        { id: 'a', label: 'Take a walk and let ideas drift', traits: { flow: 3 } },
        { id: 'b', label: 'Break the problem into tiny steps', traits: { structure: 3 } },
        { id: 'c', label: 'Talk it out with someone', traits: { collaborative: 3 } },
        { id: 'd', label: 'Set a timer and sprint', traits: { spark: 3 } },
      ]},
      { id: 'q2', prompt: 'Your workspace is...', options: [
        { id: 'a', label: 'Collected objects and half-finished sketches', traits: { flow: 2, spark: 1 } },
        { id: 'b', label: 'Clean grid, labeled drawers', traits: { structure: 3 } },
        { id: 'c', label: 'A table big enough for many hands', traits: { collaborative: 3 } },
        { id: 'd', label: 'A whiteboard full of wild arrows', traits: { spark: 3 } },
      ]},
      { id: 'q3', prompt: 'You finish projects when...', options: [
        { id: 'a', label: 'You feel the moment is right', traits: { flow: 3 } },
        { id: 'b', label: 'You have a checklist and deadline', traits: { structure: 3 } },
        { id: 'c', label: 'Someone expects it from you', traits: { collaborative: 2, spark: 1 } },
        { id: 'd', label: 'Excitement outweighs perfection', traits: { spark: 3 } },
      ]},
      { id: 'q4', prompt: 'Your favorite feedback is...', options: [
        { id: 'a', label: '“This feels alive”', traits: { flow: 3 } },
        { id: 'b', label: '“This is so clear and useful”', traits: { structure: 3 } },
        { id: 'c', label: '“I want to build on this”', traits: { collaborative: 3 } },
        { id: 'd', label: '“I’ve never seen anything like this”', traits: { spark: 3 } },
      ]},
      { id: 'q5', prompt: 'Creativity for you is...', options: [
        { id: 'a', label: 'A river — keep moving', traits: { flow: 3 } },
        { id: 'b', label: 'Architecture — design supports delight', traits: { structure: 3 } },
        { id: 'c', label: 'Conversation — ideas need listeners', traits: { collaborative: 3 } },
        { id: 'd', label: 'Lightning — catch it fast', traits: { spark: 3 } },
      ]},
    ],
    results: [
      { id: 'flow', title: 'The River', tagline: 'You create by flowing, not forcing.', description: 'Your best work arrives when you stay in motion. Rituals and gentle momentum matter more than rigid plans.', strengths: ['Sustained imagination', 'Intuitive editing'], preferences: ['Long walks', 'Morning pages'], recommendations: ['Daily continuous creation, no editing', 'Try generative art tools'], color: '#00e5cc' },
      { id: 'structure', title: 'The Architect', tagline: 'You build creativity that lasts.', description: 'You love constraints that liberate. Your work is thoughtful, usable, and secretly playful.', strengths: ['Craft and care', 'Systems for creativity'], preferences: ['Templates', 'Well-defined briefs'], recommendations: ['Design your ideal creative system', 'Teach what you make'], color: '#7c5cff' },
      { id: 'collaborative', title: 'The Ensemble', tagline: 'You make better together.', description: 'Ideas multiply when shared. You spark others and let their sparks reshape you.', strengths: ['Co-creation', 'Generous feedback'], preferences: ['Jam sessions', 'Shared studios'], recommendations: ['Host a weekly co-make hour', 'Start a collaborative zine'], color: '#ffb020' },
      { id: 'spark', title: 'The Spark', tagline: 'You light up the new.', description: 'You live for the first flash — novelty, surprise, a bold stroke. You start what others finish.', strengths: ['Bold beginnings', 'Fearless pivots'], preferences: ['Rapid prototypes', 'Constraints & timers'], recommendations: ['30-day micro-project challenge', 'Try story sprints'], color: '#ff4d6e' },
    ]
  },
  {
    id: 'future-lens',
    title: 'Your Future Lens',
    description: 'How do you imagine tomorrow?',
    color: '#00e5cc',
    questions: [
      { id: 'q1', prompt: 'The future is...', options: [{id:'a', label:'Something we design together', traits:{collective:3}}, {id:'b', label:'Full of tools we haven’t imagined', traits:{tech:3}}, {id:'c', label:'A return to what matters', traits:{human:3}}, {id:'d', label:'Weird in the best way', traits:{weird:3}}]},
      { id: 'q2', prompt: 'You’d fund...', options: [{id:'a', label:'Neighborhood commons and libraries', traits:{collective:3}}, {id:'b', label:'Open research labs', traits:{tech:3}}, {id:'c', label:'Artist residencies everywhere', traits:{human:3}}, {id:'d', label:'Experimental cities', traits:{weird:3}}]},
      { id: 'q3', prompt: 'A good day in 2040...', options: [{id:'a', label:'People sharing skills in person', traits:{collective:2,human:1}}, {id:'b', label:'Your AI thought-partner helps you learn', traits:{tech:3}}, {id:'c', label:'You made something with your hands', traits:{human:3}}, {id:'d', label:'You tried a new sense or language', traits:{weird:3}}]},
      { id: 'q4', prompt: 'You trust...', options: [{id:'a', label:'Communities', traits:{collective:3}}, {id:'b', label:'Curiosity and experiments', traits:{tech:2,weird:1}}, {id:'c', label:'Stories and care', traits:{human:3}}, {id:'d', label:'Surprises', traits:{weird:3}}]},
      { id: 'q5', prompt: 'Change happens when...', options: [{id:'a', label:'We organize together', traits:{collective:3}}, {id:'b', label:'We invent better tools', traits:{tech:3}}, {id:'c', label:'We listen more deeply', traits:{human:3}}, {id:'d', label:'We play with reality', traits:{weird:3}}]},
    ],
    results: [
      { id: 'collective', title: 'The Commons Builder', tagline: 'Future = together.', description: 'You believe coordination is our superpower. You imagine futures where access and care scale.', strengths: ['Community weaving', 'Long-term thinking'], preferences: ['Co-ops', 'Public spaces'], recommendations: ['Join a local commons project', 'Map your neighborhood gifts'], color: '#7c5cff' },
      { id: 'tech', title: 'The Toolmaker', tagline: 'Future = better instruments.', description: 'You see tools as extensions of imagination. You want everyone to have a lab.', strengths: ['Curiosity engineering', 'Rapid learning'], preferences: ['Prototypes', 'Open source'], recommendations: ['Learn a new creative tech monthly', 'Build tiny tools for friends'], color: '#00e5cc' },
      { id: 'human', title: 'The Keeper', tagline: 'Future = deeper human.', description: 'You protect attention, craft, and presence. Technology should serve slowness and meaning.', strengths: ['Depth', 'Care'], preferences: ['Making by hand', 'Ritual'], recommendations: ['Digital sabbath experiments', 'Apprentice a craft'], color: '#ffb020' },
      { id: 'weird', title: 'The Wonder Scout', tagline: 'Future = delightfully strange.', description: 'You want futures that surprise us. You collect edge cases and turn them into invitations.', strengths: ['Imagination', 'Play'], preferences: ['Speculative fiction', 'Alternate realities'], recommendations: ['Write “What if” postcards from 2042', 'Design a museum of the future'], color: '#ff4d6e' },
    ]
  }
]

// ========= WHAT IF EXPLORER =========
export type WhatIfScenario = {
  id: string
  slug: string
  title: string
  hook: string
  assumptions: string[]
  science: string
  speculation: string
  choices: { id: string; label: string; outcome: string; image: string }[]
  visualHint: string
  shareTemplate: string
}

export const whatIfScenarios: WhatIfScenario[] = [
  {
    id: 'two-moons',
    slug: 'earth-two-moons',
    title: 'What if Earth had two moons?',
    hook: 'Nights would never be dark, and tides would write new calendars.',
    assumptions: ['Second moon 1/3 the size of Luna', 'Orbit at 1.5x distance', 'Formed together 4B years ago'],
    science: 'Tides come from lunar gravity. Two moons would create complex tidal cycles — some days with extra-high spring tides, others canceled out. Eclipses would be weekly spectacles.',
    speculation: 'Cultures might base calendars on the dance of two lights. Coastal cities would need amphibious architecture. Werewolves would work overtime.',
    choices: [
      { id: 'tides', label: 'Follow the tides', outcome: 'Coastal farms become tide-powered. Children learn “double-tide math” in school. Surf culture is planetary.', image: '🌊' },
      { id: 'myths', label: 'Follow the myths', outcome: 'Every culture tells of the Sisters — one steady, one wandering. Festivals when they kiss in eclipse. Poets argue which moon is lonelier.', image: '🌕' },
      { id: 'space', label: 'Follow the launchpads', outcome: 'Two moons = two stepping stones. Early space age uses the smaller moon as a fuel depot. Moon-hopping is a teenage rite.', image: '🚀' },
    ],
    visualHint: 'Two luminous orbs over a tidal flat reflecting like mercury.',
    shareTemplate: 'I explored a world with two moons — now my nights feel too simple.'
  },
  {
    id: 'internet-vanished',
    slug: 'internet-disappeared',
    title: 'What if the internet disappeared tomorrow?',
    hook: 'No cloud, no feeds — just the world as it was, suddenly.',
    assumptions: ['Global internet backbone fails', 'No quick fix for 90 days', 'Phones still work for calls/SMS'],
    science: 'The internet is physical: undersea cables, data centers, protocols. Losing it would halt logistics, finance, and cloud services. Knowledge wouldn’t vanish — libraries and local copies remain — but access fragments.',
    speculation: 'Neighborhoods would rediscover bulletin boards. Radio would surge. You’d memorize phone numbers again. Boredom would become a creative force.',
    choices: [
      { id: 'city', label: 'Stay in the city', outcome: 'Libraries have lines. Mesh networks bloom from rooftops. You trade USB sticks like mixtapes. The city feels smaller, louder, kinder.', image: '🏙️' },
      { id: 'make', label: 'Make things', outcome: 'Without tutorials, you learn by asking elders. Repair cafés boom. Your hands get smarter. You ship a zine by post.', image: '🛠️' },
      { id: 'nature', label: 'Go outside', outcome: 'Without maps that update, you learn to navigate. Nights are for stories, not scrolling. You remember how to be bored — and it feels like imagination again.', image: '🌲' },
    ],
    visualHint: 'A street where Wi-Fi symbols fade and paper maps unfold.',
    shareTemplate: 'I imagined 90 days without internet — I’d actually touch grass.'
  },
  {
    id: 'learn-instant',
    slug: 'learn-any-language-instantly',
    title: 'What if you could learn any language instantly?',
    hook: 'Everyone could speak to everyone. What would we say?',
    assumptions: ['Neural implant or pill gives fluency in hours', 'Accent perfect, culture still to learn', 'Works for any living or revived language'],
    science: 'Language fluency uses memory, pattern recognition, and motor control. Instant learning would still leave cultural fluency — humor, taboo, history — to be lived. Brain plasticity would still need social practice to make language *meaningful*.',
    speculation: 'Tourism transforms. Endangered languages rebound. Secrets get harder to keep. Poetry explodes as people translate untranslatable words.',
    choices: [
      { id: 'revive', label: 'Revive a sleeping language', outcome: 'You learn Māori or Ladino and join its living room. Elders weep hearing jokes in their mother tongue again.', image: '📜' },
      { id: 'connect', label: 'Connect across the world', outcome: 'You join a global dinner where everyone speaks each other’s tongue. Misunderstandings remain — but now they’re interesting.', image: '🌏' },
      { id: 'create', label: 'Invent a new one', outcome: 'With everyone fluent, you and friends make a secret language for play. It becomes a song that cities hum.', image: '✨' },
    ],
    visualHint: 'Speech bubbles in many scripts weaving into a tapestry.',
    shareTemplate: 'If I could speak any language instantly, I’d start by listening.'
  },
  {
    id: 'mars-live',
    slug: 'humans-lived-on-mars',
    title: 'What if humans lived on Mars?',
    hook: 'Red dust, low gravity, and a second home.',
    assumptions: ['Self-sustaining city of 100,000 by 2050', 'Domes + lava tubes', '6-month supply chain from Earth'],
    science: 'Mars gravity is 38% of Earth’s — you’d leap, but bones thin without exercise. No breathable air; radiation high without shielding. Dust storms can veil the planet for months. Growing food means recycling every drop.',
    speculation: 'Martian culture would be frugal, inventive, and tall. Sports would be spectacular. Time would feel different with a 24h39m day.',
    choices: [
      { id: 'build', label: 'Design the habitat', outcome: 'You grow bamboo in lava tubes, print homes from regolith. Windows are screens showing Earthrise. Privacy is rare, community is everything.', image: '🏠' },
      { id: 'explore', label: 'Explore Valles Marineris', outcome: 'You rappel a 7km canyon wall — twice the Grand Canyon. Dust devils dance like spirits. You find ancient riverbeds and wonder who else looked.', image: '🏔️' },
      { id: 'culture', label: 'Start a Mars festival', outcome: 'You invent “Solstice Leap” — a low-gravity dance where elders fly. Earth watches, jealous and proud.', image: '🎉' },
    ],
    visualHint: 'A canyon city glowing amber inside glass, under a butterscotch sky.',
    shareTemplate: 'I’d thrive on Mars — low gravity, high imagination.'
  },
  {
    id: 'ocean-depths',
    slug: 'explore-ocean-depths',
    title: 'What if you could explore the ocean depths safely?',
    hook: '96% of Earth’s habitable space is midnight water.',
    assumptions: ['Personal submersible, safe to 11,000m', 'Breathable, silent', 'No harm to ecosystems'],
    science: 'Pressure doubles every 10m. Below 1000m, no sunlight; animals make their own light. The deep is less mapped than Mars. Most species there are still unnamed.',
    speculation: 'We’d find pharmacies in sponges, cities of siphonophores, and maybe answers to how life began.',
    choices: [
      { id: 'glow', label: 'Follow the glow', outcome: 'You drift through a forest of bioluminescent jellies. They pulse in conversation. You learn to read light as language.', image: '✨' },
      { id: 'ancient', label: 'Touch the ancient', outcome: 'At a black smoker, you see life that eats chemistry, not sun. It’s been here 3 billion years, quietly reminding you what “alive” means.', image: '🦑' },
      { id: 'protect', label: 'Protect it', outcome: 'You map a plastic canyon and tag it for cleanup drones. Wonder without stewardship is just sightseeing.', image: '🌊' },
    ],
    visualHint: 'A diver surrounded by lantern creatures in ink-black water.',
    shareTemplate: 'The deep ocean is Earth’s alien planet — and I’d go.'
  }
]

// ========= MYSTERY ROOM =========
export type Mystery = {
  id: string
  slug: string
  title: string
  difficulty: 'Easy'|'Medium'|'Hard'
  estMinutes: number
  isPremium: boolean
  premise: string
  victim?: string
  location: string
  characters: { id: string; name: string; role: string; bio: string; motive?: string }[]
  evidence: { id: string; title: string; description: string; hidden?: string }[]
  timeline: { time: string; event: string }[]
  clues: string[]
  solution: { culpritId: string; explanation: string; trick: string }
  hints: string[]
}

export const mysteries: Mystery[] = [
  {
    id: 'vanishing-violin',
    slug: 'the-vanishing-violin',
    title: 'The Vanishing Violin',
    difficulty: 'Easy',
    estMinutes: 12,
    isPremium: false,
    premise: 'During intermission at the Arcade Philharmonic, the 300-year-old “Nightingale” violin vanishes from a locked dressing room. The concertmaster swears the door was watched.',
    location: 'Arcade Concert Hall, Dressing Room 3 — 7:42 PM',
    characters: [
      { id: 'elena', name: 'Elena Varga', role: 'Concertmaster', bio: 'First chair, fierce temper. Says she stepped out for 2 minutes to tune the orchestra.', motive: 'None — her career depends on the violin' },
      { id: 'marcus', name: 'Marcus Hale', role: 'Stage Manager', bio: 'Has master keys, claims he was moving a podium.', motive: 'Owey gambling debt; offered $20k for violin photo (not violin)' },
      { id: 'sofia', name: 'Sofia Park', role: 'Second Violin', bio: 'Was seen near dressing room with a violin case.', motive: 'Jealous of Elena; but her case was empty after' },
      { id: 'james', name: 'James Okoro', role: 'Security Guard', bio: 'Watched hallway via monitor; says no one entered.', motive: 'None' },
    ],
    evidence: [
      { id: 'e1', title: 'Lock Log', description: 'Electronic lock shows: 7:38 Elena out, 7:40 Marcus master-key in, 7:41 Marcus out, 7:42 Sofia in (card), 7:44 Sofia out.' },
      { id: 'e2', title: 'Violin Case', description: 'Elena’s case found in trash, empty. Rosin dust inside matches Nightingale.' },
      { id: 'e3', title: 'Security Monitor', description: 'James’s feed shows hallway static 7:39-7:41 — timestamp jump. Tape was looped.' },
      { id: 'e4', title: 'Podium Cart', description: 'Podium on wheels was moved to block dressing room door from camera view at 7:39.' },
    ],
    timeline: [
      { time: '7:30', event: 'Elena places Nightingale in Room 3, locks door' },
      { time: '7:38', event: 'Elena leaves to warm up orchestra' },
      { time: '7:39', event: 'Podium moved — camera blinded' },
      { time: '7:40', event: 'Marcus enters with master key' },
      { time: '7:42', event: 'Sofia enters with her own room card — but which room?' },
      { time: '7:45', event: 'Elena returns — violin gone' },
    ],
    clues: ['Sofia’s card opens Second Violin room (Room 2), not Room 3 — but log says Room 3. Means card was reprogrammed.', 'Marcus has master key and moves podium — classic misdirection.'],
    solution: { culpritId: 'marcus', explanation: 'Marcus looped the security feed (he knows the DVR), blocked the camera with the podium, then used his master key to take the violin at 7:40 and stash it in the podium’s hollow base. He reprogrammed Sofia’s card to ping Room 3 at 7:42 to frame her. Elena’s case was thrown away to suggest theft by stranger.', trick: 'Check the podium — unscrew the base. Also check DVR logs for loop.' },
    hints: ['Who can loop security footage?', 'Why move a podium?', 'Whose key accesses everything?']
  },
  {
    id: 'midnight-library',
    slug: 'midnight-library-code',
    title: 'The Midnight Library Code',
    difficulty: 'Medium',
    estMinutes: 18,
    isPremium: false,
    premise: 'The Arcade Library’s rare book “Codex of Ash” is found with pages replaced by perfect forgeries. The swap happened between closing (9 PM) and midnight. Four people had access.',
    location: 'Arcade Library, Rare Books Cage',
    characters: [
      { id: 'clara', name: 'Clara Finch', role: 'Librarian', bio: 'Passionate, overworked. Left at 9:05 PM, says she armed the cage alarm.' },
      { id: 'dev', name: 'Dev Anand', role: 'Conservator', bio: 'Expert forger-spotter. Claims he was in the lab cleaning prints.' },
      { id: 'lena', name: 'Lena Wu', role: 'Grad Student', bio: 'Requested the Codex for thesis. Was escorted out at 9 PM.' },
      { id: 'harold', name: 'Harold Finch', role: 'Night Janitor', bio: 'Clara’s father. Has been janitor 22 years. Sweeps 11 PM-2 AM.' },
    ],
    evidence: [
      { id: 'e1', title: 'Alarm Log', description: 'Cage alarm armed 9:06 PM, disarmed 11:17 PM with Clara’s code, rearmed 11:22 PM.' },
      { id: 'e2', title: 'Paper Fiber', description: 'Forged pages use modern cotton paper, not 16th-century linen. Only Dev stocks that paper — in the lab.' },
      { id: 'e3', title: 'Sign-out Sheet', description: 'Lena signed out at 9:00 PM, but handwriting shaky — different pen pressure.' },
      { id: 'e4', title: 'Janitor Cart', description: 'Harold’s cart has book cradle marks; mop water contains linen fibers from real pages.' },
    ],
    timeline: [
      { time: '9:00', event: 'Lena escorted out; Clara closes cage' },
      { time: '9:05', event: 'Clara leaves, Dev still in lab' },
      { time: '11:17', event: 'Cage disarmed with Clara’s code' },
      { time: '11:22', event: 'Cage rearmed' },
      { time: '7:00 AM', event: 'Forgeries discovered' },
    ],
    clues: ['Clara’s code used at 11:17 — who could know it? Harold is her father; she writes codes on a post-it under desk drawer (found).', 'Mop water has real-paper fibers — pages destroyed via toilet?'],
    solution: { culpritId: 'harold', explanation: 'Harold, pressured by debt collectors, agreed to destroy the real pages for a buyer who wanted the Codex lost (insurance fraud by owner). He learned Clara’s code from her desk, used it at 11:17, swapped forgeries Dev had unknowingly made as “practice copies” (Dev had forged pages as exercise, left in lab — Harold stole them). He shredded real pages and flushed them — hence linen fibers in mop water from cleaning.', trick: 'Dev is red herring; Harold used Dev’s practice forgeries.' },
    hints: ['Who knows Clara’s code?', 'Where did forged paper come from — who stocks it?', 'What does linen fiber in mop water mean?']
  },
  {
    id: 'neon-alley',
    slug: 'neon-alley-echo',
    title: 'The Neon Alley Echo',
    difficulty: 'Hard',
    estMinutes: 25,
    isPremium: true,
    premise: 'Street artist “Echo” is accused of vandalizing the new arcade mural — but Echo’s tag appears on a wall that was wet-painted at 10 PM, while Echo was live-streaming at home 8-11 PM. Somebody framed Echo.',
    location: 'Arcade District, Mural Alley',
    characters: [
      { id: 'echo', name: 'Echo (Maya Ruiz)', role: 'Muralist', bio: 'Famous for hollow-circle tags. Live-stream proved alibi.' },
      { id: 'rex', name: 'Rex Calder', role: 'Developer', bio: 'Wants alley for condos; mural blocks demolition. Hates street art.' },
      { id: 'jin', name: 'Jin Park', role: 'Assistant', bio: 'Mixes paint for Echo; knows Echo’s paint recipe.' },
      { id: 'tali', name: 'Tali Mensah', role: 'Documentarian', bio: 'Filming mural process; has all footage. Claims camera died 9:50-10:10 PM.' },
    ],
    evidence: [
      { id: 'e1', title: 'Paint Analysis', description: 'Tag paint matches Echo’s custom mix — contains rare marble dust only Jin mixes.' },
      { id: 'e2', title: 'Brush Stroke', description: 'Tag’s circle is not hollow — filled 2px inner line. Echo always leaves true hollow. Forgery.' },
      { id: 'e3', title: 'Wet Paint Sign', description: 'Mural base was still tacky at 10 PM — tag sits ON TOP of tack, not under. So tagged after 10 PM.' },
      { id: 'e4', title: 'Documentary File', description: 'Tali’s “dead battery” gap has audio still recording: faint spray hiss + Rex coughing (distinct).' },
    ],
    timeline: [
      { time: '8-11 PM', event: 'Echo live-stream from studio (verified)' },
      { time: '9:50', event: 'Tali camera “dies”' },
      { time: '10:00', event: 'Tag appears on tacky mural' },
      { time: '10:10', event: 'Camera back on, tag already there' },
    ],
    clues: ['Paint matches Echo’s mix — who mixes it? Jin. But Jin says he washed brushes at 9:30.', 'Audio in gap proves Rex present — but Rex can’t forge brush style. Need accomplice.'],
    solution: { culpritId: 'jin', explanation: 'Rex paid Jin to fram Echo. Jin used Echo’s paint (he mixes it), but his forgery slipped — inner line filled. Rex stood watch while Jin sprayed during Tali’s faked gap. Tali is complicit by turning off video but leaving audio — she took Rex’s money but left a clue out of guilt. Jin’s motive: Rex promised gallery show.', trick: 'Paint match points to Jin; brush error confirms forgery; audio pins Rex onsite.' },
    hints: ['Who has access to custom paint?', 'Look at the circle — Echo’s signature hollow vs forgery', 'What does audio in “dead” camera tell you?']
  }
]

// ========= CREATIVE MACHINE =========
export const storyStarters = [
  { id: '1', prompt: 'A librarian discovers overdue books are writing themselves at night.' },
  { id: '2', prompt: 'The city floats because its citizens hum the same note.' },
  { id: '3', prompt: 'You inherit a key that opens any door you’ve already dreamed.' },
  { id: '4', prompt: 'A language model falls in love with a typo.' },
  { id: '5', prompt: 'The last bookstore on Earth lends memories, not books.' },
]

export const worldPrompts = [
  'An archipelago where each island is a different season',
  'A vertical city inside a hollowed sequoia the size of a mountain',
  'A desert where wind writes messages you must answer',
  'A market that appears only when two strangers make eye contact',
]

// ========= DAILY QUEST =========
export function getDailyQuest(date: Date) {
  const seed = date.toISOString().slice(0,10).replace(/-/g,'')
  const n = parseInt(seed) % 1000
  const puzzles = [
    { q: 'You have 3 boxes: one apples, one oranges, one mixed but all labels are wrong. Pick one fruit from one box to fix all labels. Which box?', a: 'Mixed', explain: 'If labeled “Mixed” you know it’s actually apples or oranges. One pick reveals it, letting you deduce the other two.' },
    { q: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', a: 'Echo', explain: 'An echo repeats sound without a body.' },
    { q: 'What can travel around the world while staying in a corner?', a: 'Stamp', explain: 'A stamp stays in the corner of an envelope.' },
    { q: 'A farmer has 17 sheep, all but 9 die. How many remain?', a: '9', explain: '“All but 9 die” means 9 live.' },
    { q: 'What has keys but no locks, space but no room, you can enter but not go in?', a: 'Keyboard', explain: 'Keyboard has keys, space bar, enter key.' },
  ]
  const creative = [
    'Write a 6-word story about a message in a bottle that arrived too early.',
    'Design a holiday for procrastinators.',
    'Invent a shop that sells lost things — what’s in the window?',
    'Create a recipe for “midnight” — ingredients are feelings.',
  ]
  const curiosity = [
    'Why do cats knead? (Hint: kitten memory + scent glands)',
    'What would happen if you drilled a tunnel through Earth and jumped in?',
    'Why does time feel faster as you age?',
    'How do fireflies sync their flashes?',
  ]
  const experiment = [
    { title: 'Color Afterimage', steps: ['Stare at a bright color 30 sec', 'Close eyes, see its complement'] },
    { title: 'Paper Bridge', steps: ['Fold paper into accordion vs flat', 'Test which holds more coins'] },
    { title: 'Memory Palace', steps: ['Place 5 items along your home route', 'Recall in order — notice improvement'] },
  ]
  const idx = n % puzzles.length
  return {
    date: date.toISOString().slice(0,10),
    puzzle: puzzles[idx],
    creative: creative[idx % creative.length],
    curiosity: curiosity[idx % curiosity.length],
    experiment: experiment[idx % experiment.length],
    bonus: 'Find one thing today you’ve never noticed on your street. Sketch or note it.'
  }
}

// ========= EXPERIENCES META =========
export const experiences: ExperienceMeta[] = [
  { id: 'lab', slug: 'lab', title: 'The Personality Lab', description: 'Playful, original quizzes that reveal your curiosity style — with shareable cards.', category: 'Discover', estMinutes: 5, isPremium: false, color: '#7c5cff', icon: '🧬' },
  { id: 'explorer', slug: 'explorer', title: 'What If? Explorer', description: 'Branching hypothetical worlds with science, speculation, and choices.', category: 'Imagine', estMinutes: 8, isPremium: false, color: '#00e5cc', icon: '🌀' },
  { id: 'mystery', slug: 'mystery', title: 'The Mystery Room', description: 'Original deduction cases. Evidence, timelines, and logically sound solutions.', category: 'Solve', estMinutes: 15, isPremium: false, color: '#ffb020', icon: '🕵️' },
  { id: 'creative', slug: 'creative', title: 'The Creative Machine', description: 'Transform ideas into stories, worlds, characters, and shareable cards.', category: 'Create', estMinutes: 6, isPremium: false, color: '#ff4d6e', icon: '✦' },
  { id: 'quest', slug: 'quest', title: 'Daily Quest', description: 'A fresh puzzle, creative challenge, curiosity spark — every day.', category: 'Challenge', estMinutes: 7, isPremium: false, color: '#a3ff12', icon: '⚡' },
]
