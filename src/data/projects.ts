/* Real content pulled verbatim from ekamkooner.com (2026-07-17). */

export type Project = {
  id: string
  index: string
  title: string
  tag: string
  description: string
  stack: string[]
  links: { label: string; href: string }[]
  awards?: { title: string; body: string }[]
}

export const PROJECTS: Project[] = [
  {
    id: 'arm-sim',
    index: '01',
    title: 'Arm Sim',
    tag: 'Simulation',
    description:
      'A 7-DOF humanoid arm simulated in MuJoCo, with the forward kinematics, Jacobian, and damped least-squares IK written from scratch in NumPy. Cross-verified against MuJoCo to within 1e-6 m across 50+ random poses.',
    stack: ['Python', 'NumPy', 'MuJoCo', 'MJCF'],
    links: [{ label: 'github', href: 'https://github.com/Ekko656' }],
  },
  {
    id: 'ubc-bionics',
    index: '02',
    title: 'UBC Bionics',
    tag: 'Embedded',
    description:
      'Embedded software for a trans-radial prosthetic arm. Working on the Rust codebase that handles the lower-level systems work.',
    stack: ['Rust', 'PyO3', 'STM32', 'I²C'],
    links: [
      { label: 'github', href: 'https://github.com/Ekko656' },
      { label: 'website', href: 'https://ubcbionics.com' },
    ],
  },
  {
    id: 'honeykey',
    index: '03',
    title: 'HoneyKey',
    tag: 'Security',
    description:
      'A honeypot API that logs and classifies attacker behavior in real time, then generates SOC-style reports. Built in a weekend at nwHacks, finished as a Best Cybersecurity Hack finalist.',
    stack: ['Python', 'FastAPI', 'SQLite', 'MITRE ATT&CK'],
    links: [
      { label: 'github', href: 'https://github.com/Ekko656' },
      { label: 'devpost', href: 'https://devpost.com' },
    ],
  },
  {
    id: 'barrage',
    index: '04',
    title: 'Barrage',
    tag: 'Backend',
    description:
      'A concurrent API load tester that fires thousands of simultaneous requests and visualizes response times in a live dashboard. Useful for finding the exact point an API starts to break.',
    stack: ['Java', 'Spring Boot', 'JUnit 5', 'jQuery'],
    links: [
      { label: 'github', href: 'https://github.com/Ekko656' },
      { label: 'live demo', href: 'https://github.com/Ekko656' },
    ],
  },
  {
    id: 'vex',
    index: '05',
    title: 'VEX Robotics',
    tag: 'Robotics',
    description:
      "Built autonomous navigation for my high school's VEX team across two years. We finished as Alberta's top-ranked team and competed at the World Championship in Dallas.",
    stack: ['C++', 'PID', 'Pure Pursuit', 'Odometry'],
    links: [{ label: 'github', href: 'https://github.com/Ekko656' }],
    awards: [
      {
        title: 'VEX Robotics Tournament Champion',
        body: 'Awarded for excellence in robot design, programming, and competition strategy. Contributed to both technical development and team collaboration to achieve first place.',
      },
      {
        title: 'VEX Robotics Judges Award',
        body: 'Recognized for a well-rounded and complex robot by a team of qualified judges in the engineering field.',
      },
      {
        title: 'VEX Robotics Design Award',
        body: 'Recognized for engineering skills and innovations that led to the best-designed robot at a competition open to teams throughout Alberta & Saskatchewan.',
      },
      {
        title: 'Top 15 · Mecha Mayhem Finalist',
        body: "Top 15 finalist at Canada's largest international competition — 260+ teams from China, Australia, UK, Brazil and more. Applied complex autonomous functions to lead the team there.",
      },
    ],
  },
  {
    id: 'ultrasonic-claw',
    index: '06',
    title: 'Ultrasonic Claw',
    tag: 'Hardware',
    description:
      'A claw that uses an ultrasonic sensor to detect nearby objects, clamps onto them for a few seconds, then releases. A class project built with a hand-modeled CAD design and a custom control loop on the Arduino.',
    stack: ['Arduino', 'C++', 'Ultrasonic (HC-SR04)', 'Fusion 360'],
    links: [],
  },
  {
    id: 'rc-car',
    index: '07',
    title: 'Arduino RC Car',
    tag: 'Hardware',
    description:
      'A Bluetooth module paired to a phone controller app and dual servos for drive. Won first place in a high school battlebot competition and set the school record for item collection during the event.',
    stack: ['Arduino', 'C++', 'Bluetooth HC-05', 'Servos'],
    links: [],
  },
]

export const MANIFESTO_LINES = [
  'Who is engineering for?',
  "It's a question I keep coming back to.",
  'Most of what gets built today is built for the people who need it least.',
  'Faster trading algorithms. Sharper ad targeting. Another delivery app.',
  'Sharp minds, pointed at the easiest problems with the loudest payouts.',
  'I want to spend my life pointed somewhere else.',
  "At the older person who can't reach the top shelf anymore.",
  'At the hospital running short on night staff.',
  'At the parent who needs an extra set of hands.',
  'This is why I study Biomedical Engineering at UBC.',
  'This is why I am aiming at humanoid robotics.',
  'Not for the technology. For who the technology is able to serve.',
  'Everything I build comes back to that.',
]

export const CONTACT = {
  email: 'ekooner656@gmail.com',
  linkedin: 'https://www.linkedin.com/in/ekam-kooner/',
  github: 'https://github.com/Ekko656',
  status: 'Open to internships · Summer 2026',
  location: 'Calgary → Vancouver',
}

export const OFF_CLOCK = ['Volleyball', 'NBA', 'League of Legends', 'Drake', 'Boxing']
