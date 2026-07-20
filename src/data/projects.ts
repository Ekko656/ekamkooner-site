/* Real content from ekamkooner.com, tightened. Media files live in
   public/projects, downloaded from the current site. */

export type Project = {
  id: string
  index: string
  title: string
  tag: string
  category: 'Robotics' | 'Software' | 'Hardware' 
  description: string
  stack: string[]
  media: { type: 'video' | 'image'; src: string; poster?: string }
  /* Optional: a hosted clip played in the detail popup instead of `media`.
     The card still uses `media` for its thumbnail, since an iframe cannot
     be driven by the hover-to-play behaviour the board relies on. */
  embed?: { provider: 'youtube'; id: string }
  links: { label: string; href: string }[]
  awards?: { title: string; body: string }[]
}

export const PROJECTS: Project[] = [
  {
    id: 'arm-sim',
    category: 'Robotics',
    index: '01',
    title: 'Arm Sim',
    tag: 'Simulation',
    description:
      'A 7 DOF humanoid arm simulated in MuJoCo. I wrote the forward kinematics, the Jacobian, and damped least squares IK from scratch in NumPy, then verified my math against MuJoCo to a millionth of a metre over 50 random poses.',
    stack: ['Python', 'NumPy', 'MuJoCo', 'MJCF'],
    media: { type: 'video', src: '/projects/arm-sim.webm' },
    links: [{ label: 'GitHub', href: 'https://github.com/Ekko656' }],
  },
  {
    id: 'ubc-bionics',
    category: 'Robotics',
    index: '02',
    title: 'UBC Bionics',
    tag: 'Embedded',
    description:
      'Embedded software for a transradial prosthetic arm. I work on the Rust codebase that handles the lower level systems work.',
    stack: ['Rust', 'PyO3', 'STM32', 'I²C'],
    media: { type: 'video', src: '/projects/ubc-bionics.mp4', poster: '/projects/ubcbionics.png' },
    links: [
      { label: 'GitHub', href: 'https://github.com/Ekko656' },
      { label: 'Website', href: 'https://ubcbionics.com' },
    ],
  },
  {
    id: 'honeykey',
    category: 'Software',
    index: '03',
    title: 'HoneyKey',
    tag: 'Security',
    description:
      'A honeypot API that logs and classifies attacker behavior in real time, then generates SOC style reports. Built in a weekend at nwHacks, where it finished as a Best Cybersecurity Hack finalist.',
    stack: ['Python', 'FastAPI', 'SQLite', 'MITRE ATT&CK'],
    media: { type: 'image', src: '/projects/honeykey.png' },
    embed: { provider: 'youtube', id: '37EOq--P9oo' },
    links: [
      { label: 'GitHub', href: 'https://github.com/Ekko656' },
      { label: 'Devpost', href: 'https://devpost.com' },
    ],
  },
  {
    id: 'barrage',
    category: 'Software',
    index: '04',
    title: 'Barrage',
    tag: 'Backend',
    description:
      'A concurrent API load tester that fires thousands of simultaneous requests and visualizes response times in a live dashboard. Useful for finding the exact point an API starts to break.',
    stack: ['Java', 'Spring Boot', 'JUnit 5', 'jQuery'],
    media: { type: 'image', src: '/projects/barrage.png' },
    links: [{ label: 'GitHub', href: 'https://github.com/Ekko656' }],
  },
  {
    id: 'vex',
    category: 'Robotics',
    index: '05',
    title: 'VEX Robotics',
    tag: 'Robotics',
    description:
      'I built autonomous navigation for my high school VEX team across two years. We finished as the top ranked team in Alberta and competed at the World Championship in Dallas.',
    stack: ['C++', 'PID', 'Pure Pursuit', 'Odometry'],
    media: { type: 'image', src: '/projects/vex.png' },
    links: [{ label: 'GitHub', href: 'https://github.com/Ekko656' }],
    awards: [
      {
        title: 'Tournament Champion',
        body: 'First place for excellence in robot design, programming, and competition strategy.',
      },
      {
        title: 'Judges Award',
        body: 'Recognized for a well rounded and complex robot by a panel of judges from the engineering field.',
      },
      {
        title: 'Design Award',
        body: 'Best designed robot at a competition open to teams across Alberta and Saskatchewan.',
      },
      {
        title: 'Mecha Mayhem Top 15',
        body: 'Top 15 finalist at the largest international competition in Canada, over 260 teams from China, Australia, the UK, Brazil and beyond.',
      },
    ],
  },
  {
    id: 'ultrasonic-claw',
    category: 'Hardware',
    index: '06',
    title: 'Ultrasonic Claw',
    tag: 'Hardware',
    description:
      'A claw that senses nearby objects with ultrasound, clamps on for a few seconds, then lets go. Hand modeled CAD and a custom control loop running on an Arduino.',
    stack: ['Arduino', 'C++', 'HC SR04', 'Fusion 360'],
    media: { type: 'video', src: '/projects/claw.mp4', poster: '/projects/claw.jpg' },
    links: [],
  },
  {
    id: 'rc-car',
    category: 'Hardware',
    index: '07',
    title: 'Arduino RC Car',
    tag: 'Hardware',
    description:
      'A Bluetooth module paired to a phone controller app with dual servos for drive. First place in a high school battlebot competition and a school record for item collection.',
    stack: ['Arduino', 'C++', 'Bluetooth HC 05', 'Servos'],
    media: { type: 'image', src: '/projects/rc-car.jpg' },
    links: [],
  },
]

export const MANIFESTO = {
  lead: 'Who is engineering for?',
  lines: [
    'Most of what gets built today is built for the people who need it least.',
    'Faster trading algorithms. Sharper ad targeting. Another delivery app.',
    'I want to spend my life pointed somewhere else.',
    'At the older person who cannot reach the top shelf anymore.',
    'At the hospital running short on night staff.',
    'At the parent who needs an extra set of hands.',
  ],
  close: 'Everything I build comes back to that.',
}

export const CONTACT = {
  email: 'ekooner656@gmail.com',
  linkedin: 'https://www.linkedin.com/in/ekam-kooner/',
  github: 'https://github.com/Ekko656',
  status: 'Open to internships for Summer 2026',
}

export const OFF_CLOCK = ['Volleyball', 'NBA', 'League of Legends', 'Drake', 'Boxing']
