export interface SkillCategory {
  category: string;
  skills: string[];
}

export const POPULAR_SKILLS = [
  'Python',
  'React',
  'SQL',
  'TypeScript',
  'Node.js',
  'Next.js',
  'PostgreSQL',
  'Docker',
  'FastAPI',
  'Go',
  'Rust',
  'Tailwind CSS',
  'GraphQL',
  'MongoDB',
  'AWS',
  'Redis',
  'Vue.js',
  'Django',
  'Spring Boot',
  'Flutter',
  'Swift',
  'Kotlin',
  'Kubernetes',
  'PyTorch',
  'TensorFlow',
  'Kafka'
];

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    category: 'Languages',
    skills: ['Python', 'TypeScript', 'JavaScript', 'Go', 'Rust', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin']
  },
  {
    category: 'Frontend & UI',
    skills: ['React', 'Next.js', 'Vue.js', 'Svelte', 'Tailwind CSS', 'Angular', 'HTML5/CSS3', 'Framer Motion', 'Redux', 'Zustand']
  },
  {
    category: 'Backend & APIs',
    skills: ['Node.js', 'Express', 'FastAPI', 'Django', 'Spring Boot', 'NestJS', 'GraphQL', 'gRPC', 'Flask', 'Ruby on Rails']
  },
  {
    category: 'Databases & Cache',
    skills: ['PostgreSQL', 'SQL', 'MongoDB', 'Redis', 'MySQL', 'SQLite', 'Prisma', 'Supabase', 'Elasticsearch', 'DynamoDB']
  },
  {
    category: 'Cloud & DevOps',
    skills: ['Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'GitHub Actions', 'Terraform', 'CI/CD', 'Nginx', 'Vercel']
  },
  {
    category: 'AI & Data Engineering',
    skills: ['PyTorch', 'TensorFlow', 'OpenAI API', 'Gemini API', 'Pandas', 'LangChain', 'RAG', 'Vector DBs', 'Kafka', 'Apache Spark']
  }
];

export const PROJECT_TYPES = [
  'Web App',
  'Full-Stack App',
  'Mobile App',
  'CLI Tool',
  'API / Backend Service',
  'AI / LLM Application',
  'DevOps & Cloud Pipeline',
  'Browser Extension',
  'Real-time / WebSocket Tool',
  'Desktop Application'
];

export const TIME_OPTIONS = [
  '1 Day',
  'Weekend (2-3 Days)',
  '1 Week',
  '2 Weeks',
  '1 Month'
];
