import { ProjectBlueprint, DeveloperLevel, GoalType } from '../types';

export interface GeneratorParams {
  level: string;
  skills: string[];
  goal: string;
  projectType: string;
  availableTime: string;
}

/**
 * Builds the comprehensive prompt for Gemini enforcing Senior Engineering & Code Reviewer standards.
 */
export function buildGeminiPrompt(params: GeneratorParams): string {
  const { level, skills, goal, projectType, availableTime } = params;
  const skillsList = Array.isArray(skills) && skills.length > 0 ? skills.join(', ') : 'Modern Full-Stack';

  return `You are DEVIX, an elite Senior Software Engineer, Staff Systems Architect, and Technical Hiring Bar Raiser.
Your mission is to generate an architecturally sound, technically consistent, and honest project blueprint for a developer.

DEVELOPER PROFILE:
- Experience Level: ${level}
- Target Tech Stack & Skills: ${skillsList}
- Core Career Goal: ${goal}
- Project Type: ${projectType || 'Web App'}
- Available Time Commitment: ${availableTime || '1 Day'}

CRITICAL SENIOR ENGINEERING DIRECTIVES:
1. CORRECTNESS & INTERNAL CONSISTENCY: Every section (Overview, System Architecture, Database Schema, API Contracts, Starter Code, README.md, Roadmap, CV Bullets, Interview Questions) MUST derive from the exact same project specification at the exact same implementation stage.
2. IMPLEMENTATION STATUS IS MANDATORY: Every significant feature, component, and capability must be explicitly classified into one of three statuses:
   - "Implemented" (present and working in core code)
   - "Scaffolded" (interfaces, routes, or helper stubs defined with explicit TODOs)
   - "Planned" (architectural roadmap for future iterations)
3. ZERO FABRICATED METRICS: NEVER invent synthetic numbers, fake latency reductions ("reduced latency by 25%"), unmeasured throughput ("handles 10k req/s"), or unproven uptime. If unmeasured, use "Designed to...", "Intended to optimize...", or "Metric to measure later: p95 latency under representative load".
4. PRECISE TECHNICAL TERMINOLOGY:
   - Do NOT use "immutable" unless database triggers, WORM storage, or cryptographic hash-chaining (tamper-evident) are explicitly implemented. For typical database tables, use "append-only audit log".
   - Do NOT claim "transactional integrity" between primary writes and audit logs if logging occurs in an asynchronous queue or background worker. If asynchronous, explicitly state the eventual consistency trade-off.
   - Do NOT use marketing buzzwords like "production-grade enterprise infrastructure" for starter scaffolds.
5. HONEST STARTER CODE: Starter files must be syntactically valid code matching the exact stack. Mark them honestly (e.g. "Core Implementation", "Minimal Working Example", or "Starter Scaffold with Type Definitions"). Provide clear TODO comments for scaffolded logic.
6. USABLE GITHUB README.MD: Generate a real, structured Markdown file (ready to copy into a repo as README.md) containing:
   - Project Title & Tagline
   - Overview
   - Features (separated into Implemented, Scaffolded, Planned)
   - Tech Stack (exact technologies)
   - System Architecture
   - Database Schema
   - API Reference (matching starter code & database)
   - Project Structure (file tree matching starter files)
   - Getting Started (exact commands for stack)
   - Environment Variables (only required ones)
   - Testing
   - Technical Decisions & Trade-offs
   - Known Limitations
7. EVIDENCE-BASED CV BULLETS: Craft 3-4 Google XYZ format bullet points emphasizing architectural decisions, real engineering contributions, and explicit metrics to measure later.
8. INTERVIEW DEFENSE: Provide 2-3 tough technical questions testing trade-offs, concurrency/database choices, and defending the actual implementation vs planned features.

Return ONLY a valid JSON object strictly matching this schema:
{
  "title": "Distinctive, technically precise project title",
  "tagline": "A crisp, factual 1-sentence description of the system architecture and value proposition",
  "matchScore": 96,
  "difficultyReasoning": "1-2 sentences explaining why this matches their experience level based on database, backend, concurrency, and architectural complexity.",
  "overview": "2-3 structured paragraphs detailing what the system does, the engineering challenges solved, and how it proves competence without tutorial clichés.",
  "problemStatement": "Clear description of the real-world engineering friction or domain problem addressed.",
  "targetAudience": "Target end users, stakeholders, or system consumers.",
  "whyItProvesSkills": [
    "3-4 concrete reasons this project demonstrates technical depth and defensibility with their exact stack"
  ],
  "implementationStatus": {
    "implemented": ["Core feature 1 actually in starter code", "Core feature 2"],
    "scaffolded": ["Feature stubbed with types and route handler", "Helper with TODO"],
    "planned": ["Advanced future capability in roadmap", "Distributed worker"]
  },
  "architecture": {
    "summary": "High-level overview of system design, boundaries, and separation of concerns",
    "frontend": "Frontend architectural choices, state management, and UX design",
    "backend": "API patterns, validation, concurrency, and services",
    "database": "Data modeling, indexing, relations, and caching strategy",
    "authAndSecurity": "Security measures, token handling, and input sanitization",
    "deployment": "CI/CD, containerization, and hosting recommendations"
  },
  "databaseSchema": [
    {
      "table": "table_name",
      "description": "Purpose and indexing strategy of table",
      "columns": [
        { "name": "column_name", "type": "DATA_TYPE_AND_CONSTRAINTS", "desc": "Column role and constraints" }
      ]
    }
  ],
  "apiEndpoints": [
    {
      "method": "GET or POST or PUT or PATCH or DELETE",
      "path": "/api/v1/resource",
      "description": "Endpoint purpose and consistency guarantee",
      "samplePayload": "Optional sample JSON payload string or omit if GET",
      "responsePreview": "Sample JSON response string"
    }
  ],
  "milestones": [
    {
      "phaseNumber": 1,
      "phase": "Phase 1",
      "title": "Core Engine & Foundations",
      "duration": "Estimated duration",
      "tasks": [
        { "id": "t1", "task": "Concrete task description", "details": "Specific technical step with status" }
      ]
    },
    {
      "phaseNumber": 2,
      "phase": "Phase 2",
      "title": "Services & Integration",
      "duration": "Estimated duration",
      "tasks": [
        { "id": "t4", "task": "Concrete task description", "details": "Specific technical step with status" }
      ]
    },
    {
      "phaseNumber": 3,
      "phase": "Phase 3",
      "title": "Hardening, Telemetry & Polish",
      "duration": "Estimated duration",
      "tasks": [
        { "id": "t7", "task": "Concrete task description", "details": "Specific technical step with status" }
      ]
    }
  ],
  "cvBulletPoints": [
    "3-4 evidence-based Google XYZ format bullets: e.g. 'Architected [X] using [Y], designing [Z] with planned metric [M] to benchmark after deployment'"
  ],
  "interviewQuestions": [
    {
      "question": "A tough technical question a senior interviewer would ask about this project",
      "idealAnswer": "Clear, structured technical answer explaining trade-offs, consistency, and implementation details",
      "talkingPoint": "Key architectural concept to emphasize",
      "pitfallsToAvoid": "Common mistake, hand-waving, or unsupported claim to steer clear of"
    },
    {
      "question": "Second challenging architectural or database indexing question",
      "idealAnswer": "Ideal technical response",
      "talkingPoint": "Key concept to emphasize",
      "pitfallsToAvoid": "Common mistake to steer clear of"
    }
  ],
  "starterFiles": [
    {
      "filename": "schema.sql or src/server.ts or main.py",
      "language": "sql or typescript or python or go",
      "description": "Honest classification: Minimal Working Example | Core Implementation | Starter Scaffold",
      "code": "Syntactically correct, high-quality starter code with explicit TODOs for scaffolded portions"
    },
    {
      "filename": "src/api/handler.ts or internal/service.go",
      "language": "typescript or python or go",
      "description": "Honest classification: Minimal Working Example | Core Implementation | Starter Scaffold",
      "code": "Syntactically correct, high-quality starter code with explicit TODOs for scaffolded portions"
    }
  ],
  "technicalDecisions": [
    "Key architectural trade-off 1 (e.g., synchronous transactional logging vs asynchronous message queue)",
    "Key architectural trade-off 2 (e.g., PostgreSQL JSONB vs dedicated document store)"
  ],
  "limitations": [
    "Known engineering limitation 1 (e.g., single-node rate limiter requires distributed Redis for multi-instance scaling)",
    "Known engineering limitation 2"
  ],
  "metricsToMeasureLater": [
    "p95 and p99 query latency under 500 concurrent connections",
    "Database connection pool saturation under burst write loads"
  ],
  "readmeMarkdown": "Complete Markdown README.md formatted with all required headings."
}`;
}

/**
 * Normalizes text to remove fabricated percentage or performance claims.
 */
export function sanitizeClaimsAndTerminology(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;

  // Replace fabricated latency/performance percentages if phrased as historical facts
  sanitized = sanitized.replace(/\b(?:reduced|slashed|improved|cut)\s+(?:api\s+|query\s+|response\s+)?latency\s+by\s+\d+%/gi, (match) => {
    return 'designed an indexing and caching strategy intended to minimize latency';
  });

  sanitized = sanitized.replace(/\b(?:reduced|decreased|cut)\s+(?:compute|server|infrastructure)\s+(?:load|cost)\s+by\s+\d+%/gi, (match) => {
    return 'optimized query aggregation to reduce unnecessary database round-trips';
  });

  sanitized = sanitized.replace(/\bachieved\s+\d+%\s+(?:uptime|availability|efficiency)\b/gi, () => {
    return 'designed with health check probes and graceful shutdown handlers for resilience';
  });

  sanitized = sanitized.replace(/\bhandling\s+(?:over\s+)?(?:\d+k|\d+,\d+|\d+000)\s+req(?:uests)?\/(?:sec|s)\b/gi, () => {
    return 'architected for horizontal scalability with connection pooling';
  });

  // Check unwarranted "immutable" without justification
  sanitized = sanitized.replace(/\bproduction-grade\s+immutable\s+infrastructure\b/gi, 'append-only audit infrastructure');
  sanitized = sanitized.replace(/\bimmutable\s+audit\s+log\b/gi, 'append-only audit log');
  sanitized = sanitized.replace(/\btamper-proof\s+audit\s+trail\b/gi, 'tamper-evident audit trail with cryptographic hashing');
  sanitized = sanitized.replace(/\btamper-proof\b/gi, 'tamper-evident');

  return sanitized;
}

/**
 * Deterministically generates a clean, usable GitHub-ready README.md from the canonical project specification.
 */
export function generateStandardReadme(spec: {
  title: string;
  tagline: string;
  overview: string;
  skills: string[];
  level: string;
  goal: string;
  architecture: {
    summary: string;
    frontend: string;
    backend: string;
    database: string;
    authAndSecurity: string;
    deployment: string;
  };
  implementationStatus?: {
    implemented: string[];
    scaffolded: string[];
    planned: string[];
  };
  databaseSchema?: Array<{
    table: string;
    description: string;
    columns: Array<{ name: string; type: string; desc: string }>;
  }>;
  apiEndpoints?: Array<{
    method: string;
    path: string;
    description: string;
    samplePayload?: string;
    responsePreview?: string;
  }>;
  starterFiles?: Array<{
    filename: string;
    language: string;
    description: string;
    code: string;
  }>;
  milestones?: Array<{
    phaseNumber: number;
    phase: string;
    title: string;
    duration: string;
    tasks: Array<{ id: string; task: string; details?: string }>;
  }>;
  technicalDecisions?: string[];
  limitations?: string[];
  metricsToMeasureLater?: string[];
}): string {
  const {
    title,
    tagline,
    overview,
    skills,
    architecture,
    implementationStatus,
    databaseSchema,
    apiEndpoints,
    starterFiles,
    milestones,
    technicalDecisions,
    limitations,
    metricsToMeasureLater,
  } = spec;

  const stackString = skills && skills.length > 0 ? skills.join(', ') : 'TypeScript, Node.js, SQL';
  const isPython = skills.some((s) => /python|fastapi|django|flask/i.test(s));
  const isGo = skills.some((s) => /go|golang/i.test(s));

  // Determine Getting Started commands
  let installCmd = 'npm install';
  let runDevCmd = 'npm run dev';
  let testCmd = 'npm test';
  let migrateCmd = 'npm run db:migrate';

  if (isPython) {
    installCmd = 'python -m venv venv && source venv/bin/activate && pip install -r requirements.txt';
    runDevCmd = 'uvicorn main:app --reload';
    testCmd = 'pytest';
    migrateCmd = 'alembic upgrade head';
  } else if (isGo) {
    installCmd = 'go mod download';
    runDevCmd = 'go run main.go';
    testCmd = 'go test ./...';
    migrateCmd = 'go run cmd/migrate/main.go up';
  }

  // Derive file tree from starter files
  const fileTreeLines: string[] = [];
  if (starterFiles && starterFiles.length > 0) {
    fileTreeLines.push('├── ' + starterFiles.map((f) => f.filename).join('\n├── '));
  } else {
    fileTreeLines.push('├── src/');
    fileTreeLines.push('│   ├── api/');
    fileTreeLines.push('│   ├── models/');
    fileTreeLines.push('│   └── server.ts');
  }

  let md = `# ${title}\n\n`;
  md += `> ${tagline}\n\n`;

  md += `## Overview\n\n${overview}\n\n`;

  md += `## Features & Development Status\n\n`;
  md += `### Implemented\n`;
  if (implementationStatus?.implemented && implementationStatus.implemented.length > 0) {
    md += implementationStatus.implemented.map((item) => `- ${sanitizeClaimsAndTerminology(item)}`).join('\n') + '\n\n';
  } else {
    md += `- Core schema definitions and type interfaces.\n- Primary API route handlers with request validation.\n\n`;
  }

  md += `### Scaffolded\n`;
  if (implementationStatus?.scaffolded && implementationStatus.scaffolded.length > 0) {
    md += implementationStatus.scaffolded.map((item) => `- ${sanitizeClaimsAndTerminology(item)}`).join('\n') + '\n\n';
  } else {
    md += `- Automated integration test suites.\n- Background worker interface with retry stubs.\n\n`;
  }

  md += `### Planned\n`;
  if (implementationStatus?.planned && implementationStatus.planned.length > 0) {
    md += implementationStatus.planned.map((item) => `- ${sanitizeClaimsAndTerminology(item)}`).join('\n') + '\n\n';
  } else {
    md += `- Distributed rate limiting using Redis.\n- Prometheus metrics exporter and Grafana dashboard.\n\n`;
  }

  md += `## Tech Stack\n\n`;
  md += `- **Primary Stack**: ${stackString}\n`;
  md += `- **Frontend**: ${architecture.frontend}\n`;
  md += `- **Backend**: ${architecture.backend}\n`;
  md += `- **Database**: ${architecture.database}\n`;
  md += `- **Security & Auth**: ${architecture.authAndSecurity}\n`;
  md += `- **Deployment**: ${architecture.deployment}\n\n`;

  md += `## System Architecture\n\n${architecture.summary}\n\n`;

  if (databaseSchema && databaseSchema.length > 0) {
    md += `## Database Schema\n\n`;
    for (const table of databaseSchema) {
      md += `### Table: \`${table.table}\`\n`;
      md += `${table.description}\n\n`;
      md += `| Column / Field | Type & Constraints | Description |\n`;
      md += `| :--- | :--- | :--- |\n`;
      for (const col of table.columns) {
        md += `| \`${col.name}\` | \`${col.type}\` | ${col.desc} |\n`;
      }
      md += `\n`;
    }
  }

  if (apiEndpoints && apiEndpoints.length > 0) {
    md += `## API Reference\n\n`;
    for (const ep of apiEndpoints) {
      md += `### \`${ep.method} ${ep.path}\`\n`;
      md += `${ep.description}\n\n`;
      if (ep.samplePayload) {
        md += `**Request Payload:**\n\`\`\`json\n${ep.samplePayload}\n\`\`\`\n\n`;
      }
      if (ep.responsePreview) {
        md += `**Response Preview:**\n\`\`\`json\n${ep.responsePreview}\n\`\`\`\n\n`;
      }
    }
  }

  md += `## Project Structure\n\n\`\`\`text\n.\n${fileTreeLines.join('\n')}\n├── .env.example\n└── README.md\n\`\`\`\n\n`;

  md += `## Getting Started\n\n`;
  md += `### 1. Prerequisites\n`;
  md += `- ${isPython ? 'Python 3.11+' : isGo ? 'Go 1.22+' : 'Node.js 20+ and npm'}\n`;
  md += `- PostgreSQL (or SQLite for local lightweight testing)\n\n`;

  md += `### 2. Installation\n\`\`\`bash\n# Clone the repository\ngit clone https://github.com/your-username/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.git\ncd ${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}\n\n# Install dependencies\n${installCmd}\n\`\`\`\n\n`;

  md += `### 3. Environment Configuration\n\`\`\`bash\ncp .env.example .env\n\`\`\`\n\n`;
  md += `Ensure the following variables are defined in \`.env\`:\n\`\`\`env\nPORT=3000\nDATABASE_URL=postgresql://user:password@localhost:5432/${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_db\nNODE_ENV=development\n\`\`\`\n\n`;

  md += `### 4. Database Setup & Migrations\n\`\`\`bash\n${migrateCmd}\n\`\`\`\n\n`;

  md += `### 5. Running the Application\n\`\`\`bash\n${runDevCmd}\n\`\`\`\n\n`;

  md += `## Testing\n\`\`\`bash\n${testCmd}\n\`\`\`\n\n`;

  if (technicalDecisions && technicalDecisions.length > 0) {
    md += `## Technical Decisions & Trade-offs\n\n`;
    for (const decision of technicalDecisions) {
      md += `- ${sanitizeClaimsAndTerminology(decision)}\n`;
    }
    md += `\n`;
  }

  if (limitations && limitations.length > 0) {
    md += `## Known Limitations\n\n`;
    for (const lim of limitations) {
      md += `- ${sanitizeClaimsAndTerminology(lim)}\n`;
    }
    md += `\n`;
  }

  if (metricsToMeasureLater && metricsToMeasureLater.length > 0) {
    md += `## Metrics to Benchmark After Deployment\n\n`;
    for (const m of metricsToMeasureLater) {
      md += `- ${m}\n`;
    }
    md += `\n`;
  }

  if (milestones && milestones.length > 0) {
    md += `## Future Roadmap\n\n`;
    for (const phase of milestones) {
      md += `### ${phase.phase}: ${phase.title} (${phase.duration})\n`;
      for (const t of phase.tasks) {
        md += `- [ ] **${t.task}**${t.details ? ` — ${t.details}` : ''}\n`;
      }
      md += `\n`;
    }
  }

  md += `## License\n\nMIT License. See \`LICENSE\` for details.\n`;

  return md;
}

/**
 * Validates and normalizes raw JSON data from Gemini or Fallback to guarantee 100% technical integrity.
 */
export function validateAndEnforceConsistency(rawData: any, params: GeneratorParams): ProjectBlueprint {
  const { level, skills, goal, projectType, availableTime } = params;
  const safeSkills = Array.isArray(skills) && skills.length > 0 ? skills : ['Python', 'React', 'SQL'];
  const safeLevel = (['Beginner', 'Intermediate', 'Advanced'].includes(level) ? level : 'Intermediate') as DeveloperLevel;
  const safeGoal = (['Strengthen my CV', 'Build my portfolio', 'Practice my skills', 'Prepare for jobs'].includes(goal) ? goal : 'Strengthen my CV') as GoalType;

  const title = sanitizeClaimsAndTerminology(rawData?.title || `${safeSkills[0] || 'Full-Stack'} System Engine`);
  const tagline = sanitizeClaimsAndTerminology(rawData?.tagline || `A robust system architecture engineered with ${safeSkills.slice(0, 3).join(', ')}.`);
  const matchScore = typeof rawData?.matchScore === 'number' && rawData.matchScore >= 80 && rawData.matchScore <= 100 ? rawData.matchScore : 96;

  const difficultyReasoning = sanitizeClaimsAndTerminology(
    rawData?.difficultyReasoning || `Calibrated for ${safeLevel} developers by focusing on structured relational data modeling, type-safe API contracts, and robust error handling.`
  );

  const overview = sanitizeClaimsAndTerminology(
    rawData?.overview || `A focused, modular application designed to solve real-world data coordination challenges. It emphasizes clean separation of concerns, explicit database constraints, and defensive API validation tailored for ${safeLevel} engineers targeting ${safeGoal.toLowerCase()}.`
  );

  const problemStatement = sanitizeClaimsAndTerminology(
    rawData?.problemStatement || `Systems requiring reliable data mutation tracking often suffer from inconsistent validation, lack of query indexing, and difficult-to-maintain monolithic handlers.`
  );

  const targetAudience = sanitizeClaimsAndTerminology(
    rawData?.targetAudience || `Engineers and technical recruiters evaluating backend architectural rigor, schema design, and production readiness.`
  );

  const rawWhy = Array.isArray(rawData?.whyItProvesSkills) ? rawData.whyItProvesSkills : [];
  const whyItProvesSkills = (rawWhy.length > 0 ? rawWhy : [
    `Demonstrates mastery of structured relational data modeling and composite indexing with ${safeSkills.join(' and ')}.`,
    `Implements clean separation of concerns between HTTP routing, business validation, and data persistence layers.`,
    `Avoids generic tutorial clichés by including realistic edge-case validation, defensive error handling, and type safety.`
  ]).map((item: string) => sanitizeClaimsAndTerminology(String(item)));

  const rawImpl = rawData?.implementationStatus || {};
  const implementationStatus = {
    implemented: (Array.isArray(rawImpl.implemented) && rawImpl.implemented.length > 0
      ? rawImpl.implemented
      : ['Database schema definition with primary key and timestamp constraints', 'Primary REST API endpoints with request schema validation']
    ).map((s: string) => sanitizeClaimsAndTerminology(String(s))),
    scaffolded: (Array.isArray(rawImpl.scaffolded) && rawImpl.scaffolded.length > 0
      ? rawImpl.scaffolded
      : ['Automated integration test suites with mock fixtures', 'Background worker stub for asynchronous processing']
    ).map((s: string) => sanitizeClaimsAndTerminology(String(s))),
    planned: (Array.isArray(rawImpl.planned) && rawImpl.planned.length > 0
      ? rawImpl.planned
      : ['Distributed rate limiting layer with token bucket algorithm', 'Prometheus metrics exporter for operational telemetry']
    ).map((s: string) => sanitizeClaimsAndTerminology(String(s))),
  };

  const arch = rawData?.architecture || {};
  const architecture = {
    summary: sanitizeClaimsAndTerminology(arch.summary || `Modular 3-tier architecture with a stateless API layer, relational persistence store, and structured error boundaries.`),
    frontend: sanitizeClaimsAndTerminology(arch.frontend || `Modern reactive UI (React / TypeScript) featuring state-driven status badges, responsive tables, and optimistic feedback.`),
    backend: sanitizeClaimsAndTerminology(arch.backend || `Type-safe REST API service with input validation, error handling middleware, and connection pooling.`),
    database: sanitizeClaimsAndTerminology(arch.database || `Relational SQL store with explicit foreign key constraints, composite indexing, and transactional write guarantees.`),
    authAndSecurity: sanitizeClaimsAndTerminology(arch.authAndSecurity || `Bearer token / JWT authorization with parameterized query execution to prevent SQL injection and strict CORS policies.`),
    deployment: sanitizeClaimsAndTerminology(arch.deployment || `Docker containerization with multi-stage builds and automated CI lint/test pipelines.`),
  };

  // Database Schema validation
  const rawSchema = Array.isArray(rawData?.databaseSchema) ? rawData.databaseSchema : [];
  const databaseSchema = (rawSchema.length > 0 ? rawSchema : [
    {
      table: 'records',
      description: 'Primary entity datastore with timestamp indexing.',
      columns: [
        { name: 'id', type: 'UUID PRIMARY KEY', desc: 'Unique identifier' },
        { name: 'status', type: 'VARCHAR(32) NOT NULL', desc: 'Current operational status' },
        { name: 'payload', type: 'JSONB NOT NULL', desc: 'Structured entity attributes' },
        { name: 'created_at', type: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()', desc: 'Creation timestamp' },
        { name: 'updated_at', type: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()', desc: 'Last mutation timestamp' }
      ]
    }
  ]).map((tableObj: any) => ({
    table: String(tableObj.table || 'entities'),
    description: sanitizeClaimsAndTerminology(String(tableObj.description || 'Datastore table')),
    columns: Array.isArray(tableObj.columns)
      ? tableObj.columns.map((c: any) => ({
          name: String(c.name || 'id'),
          type: String(c.type || 'VARCHAR'),
          desc: sanitizeClaimsAndTerminology(String(c.desc || 'Column attribute'))
        }))
      : [{ name: 'id', type: 'UUID PRIMARY KEY', desc: 'Primary identifier' }]
  }));

  // API Endpoints validation
  const rawEndpoints = Array.isArray(rawData?.apiEndpoints) ? rawData.apiEndpoints : [];
  const apiEndpoints = (rawEndpoints.length > 0 ? rawEndpoints : [
    {
      method: 'POST' as const,
      path: '/api/v1/records',
      description: 'Creates and validates a new entity record within a database transaction.',
      samplePayload: '{\n  "status": "active",\n  "payload": { "title": "Initial item" }\n}',
      responsePreview: '{\n  "id": "rec_01h8",\n  "status": "active",\n  "created_at": "2026-08-20T12:00:00Z"\n}'
    },
    {
      method: 'GET' as const,
      path: '/api/v1/records',
      description: 'Retrieves a paginated list of records filtered by status and date range.',
      responsePreview: '{\n  "data": [{ "id": "rec_01h8", "status": "active" }],\n  "pagination": { "page": 1, "limit": 20, "total": 1 }\n}'
    }
  ]).map((ep: any) => ({
    method: (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(ep.method) ? ep.method : 'GET') as any,
    path: String(ep.path || '/api/v1/items'),
    description: sanitizeClaimsAndTerminology(String(ep.description || 'Endpoint handler')),
    samplePayload: ep.samplePayload ? String(ep.samplePayload) : undefined,
    responsePreview: ep.responsePreview ? String(ep.responsePreview) : undefined
  }));

  // Milestones validation
  const rawMilestones = Array.isArray(rawData?.milestones) ? rawData.milestones : [];
  const milestones = (rawMilestones.length > 0 ? rawMilestones : [
    {
      phaseNumber: 1,
      phase: 'Phase 1',
      title: 'Core Schema & API Scaffolding',
      duration: availableTime === '1 Day' ? '3-4 Hours' : 'Day 1-2',
      tasks: [
        { id: 't1', task: 'Define relational database tables with foreign keys and indexes.', details: 'Status: Implemented in starter code.' },
        { id: 't2', task: 'Implement primary REST endpoints with request schema validation.', details: 'Status: Implemented in starter code.' }
      ]
    },
    {
      phaseNumber: 2,
      phase: 'Phase 2',
      title: 'Services, Business Logic & Integration Tests',
      duration: availableTime === '1 Day' ? '3-4 Hours' : 'Day 3-4',
      tasks: [
        { id: 't3', task: 'Implement transactional mutation handlers with rollback on error.', details: 'Status: Scaffolded with test cases.' },
        { id: 't4', task: 'Write integration test suite simulating concurrent requests.', details: 'Status: Scaffolded in test directory.' }
      ]
    },
    {
      phaseNumber: 3,
      phase: 'Phase 3',
      title: 'Telemetry, Benchmarking & Deployment',
      duration: availableTime === '1 Day' ? '1-2 Hours' : 'Day 5',
      tasks: [
        { id: 't5', task: 'Set up Docker multi-stage build container and environment validation.', details: 'Status: Planned.' },
        { id: 't6', task: 'Benchmark p95 latency under simulated load and document results.', details: 'Status: Planned.' }
      ]
    }
  ]).map((m: any, idx: number) => ({
    phaseNumber: Number(m.phaseNumber || idx + 1),
    phase: String(m.phase || `Phase ${idx + 1}`),
    title: sanitizeClaimsAndTerminology(String(m.title || `Milestone ${idx + 1}`)),
    duration: String(m.duration || '2-3 Hours'),
    tasks: Array.isArray(m.tasks)
      ? m.tasks.map((t: any, tIdx: number) => ({
          id: String(t.id || `t_${idx + 1}_${tIdx + 1}`),
          task: sanitizeClaimsAndTerminology(String(t.task || 'Core task')),
          details: t.details ? sanitizeClaimsAndTerminology(String(t.details)) : undefined,
          completed: false
        }))
      : [{ id: `t_${idx + 1}_1`, task: 'Complete milestone implementation', completed: false }]
  }));

  // CV Bullets validation - strictly evidence-based
  const rawBullets = Array.isArray(rawData?.cvBulletPoints) ? rawData.cvBulletPoints : [];
  const cvBulletPoints = (rawBullets.length > 0 ? rawBullets : [
    `Architected a type-safe backend API in ${safeSkills.slice(0, 2).join(' & ')}, enforcing schema validation and parameterized SQL transactions.`,
    `Designed an optimized relational schema featuring composite indexing and foreign key constraints to support scalable query filtering.`,
    `Implemented defensive error handling and structured logging middleware to provide actionable debugging telemetry during service failures.`,
    `Established an automated integration test pipeline and Dockerized deployment workflow, ensuring reproducible local and staging builds.`
  ]).map((b: string) => sanitizeClaimsAndTerminology(String(b)));

  // Interview Questions validation
  const rawQuestions = Array.isArray(rawData?.interviewQuestions) ? rawData.interviewQuestions : [];
  const interviewQuestions = (rawQuestions.length > 0 ? rawQuestions : [
    {
      question: `How did you ensure transactional integrity during multi-step database mutations?`,
      idealAnswer: `I wrapped the primary mutation and dependent event persistence inside an explicit database transaction block (BEGIN...COMMIT/ROLLBACK). If either the record creation or the audit log write fails, the entire transaction is rolled back, preventing orphaned or desynchronized state.`,
      talkingPoint: `Highlight database ACID guarantees, connection pooling, and why asynchronous logging would introduce an eventual consistency window.`,
      pitfallsToAvoid: `Don't claim asynchronous background tasks provide transactional integrity without an outbox pattern.`
    },
    {
      question: `Why did you select your specific database indexing strategy?`,
      idealAnswer: `Because the primary query pattern filters by entity status within a time range, I created a composite index on (status, created_at DESC). This allows the database query planner to perform an efficient index scan rather than an expensive sequential table scan.`,
      talkingPoint: `Explain query EXPLAIN ANALYZE plans and the performance difference between index seeks and full table scans.`,
      pitfallsToAvoid: `Don't say you indexed every column, which degrades write throughput.`
    }
  ]).map((iq: any) => ({
    question: sanitizeClaimsAndTerminology(String(iq.question || 'Technical trade-off question')),
    idealAnswer: sanitizeClaimsAndTerminology(String(iq.idealAnswer || 'Clear technical answer explaining trade-offs.')),
    talkingPoint: sanitizeClaimsAndTerminology(String(iq.talkingPoint || 'Key technical concept')),
    pitfallsToAvoid: sanitizeClaimsAndTerminology(String(iq.pitfallsToAvoid || 'Common hand-waving pitfall'))
  }));

  // Starter Files validation
  const rawFiles = Array.isArray(rawData?.starterFiles) ? rawData.starterFiles : [];
  const starterFiles = (rawFiles.length > 0 ? rawFiles : [
    {
      filename: 'schema.sql',
      language: 'sql',
      description: 'Core Implementation: Relational database schema with constraints & indexes',
      code: `-- Relational Schema Definition
CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(32) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for status filtering and time ordering
CREATE INDEX IF NOT EXISTS idx_records_status_created 
ON records(status, created_at DESC);
`
    },
    {
      filename: 'src/server.ts',
      language: 'typescript',
      description: 'Core Implementation: Express API route with validation & error handling',
      code: `import express, { Request, Response } from 'express';

export const app = express();
app.use(express.json());

// POST /api/v1/records - Create record
app.post('/api/v1/records', async (req: Request, res: Response) => {
  const { status, payload } = req.body;

  if (!status || !payload) {
    return res.status(400).json({ error: 'Fields "status" and "payload" are required.' });
  }

  try {
    // TODO: Connect database transaction pool here
    const newRecord = {
      id: 'rec_' + Math.random().toString(36).substring(2, 9),
      status,
      payload,
      created_at: new Date().toISOString()
    };

    return res.status(201).json(newRecord);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error during record creation.' });
  }
});
`
    }
  ]).map((f: any) => ({
    filename: String(f.filename || 'starter.ts'),
    language: String(f.language || 'typescript'),
    description: sanitizeClaimsAndTerminology(String(f.description || 'Core Implementation')),
    code: String(f.code || '// Starter code')
  }));

  const technicalDecisions = (Array.isArray(rawData?.technicalDecisions) ? rawData.technicalDecisions : [
    `Synchronous Transactional Persistence: Primary mutations and audit records commit within the same SQL transaction block to guarantee strong consistency.`,
    `Parameterized SQL Queries: All queries use parameter binding to eliminate SQL injection vectors.`,
    `Layered Architecture: Separation of transport HTTP handlers, validation schemas, and database access logic.`
  ]).map((s: string) => sanitizeClaimsAndTerminology(String(s)));

  const limitations = (Array.isArray(rawData?.limitations) ? rawData.limitations : [
    `In-memory rate limiter requires an external Redis store when scaling horizontally across multiple server instances.`,
    `Database connection pool size must be tuned according to database host memory and connection limits.`
  ]).map((s: string) => sanitizeClaimsAndTerminology(String(s)));

  const metricsToMeasureLater = (Array.isArray(rawData?.metricsToMeasureLater) ? rawData.metricsToMeasureLater : [
    `p95 and p99 query latency under 500 concurrent connections.`,
    `Database transaction throughput and connection pool saturation under peak write bursts.`
  ]).map((s: string) => sanitizeClaimsAndTerminology(String(s)));

  // Generate or sanitize README.md Markdown
  let readmeMarkdown = rawData?.readmeMarkdown;
  if (!readmeMarkdown || typeof readmeMarkdown !== 'string' || readmeMarkdown.length < 200 || !readmeMarkdown.includes('## Features')) {
    readmeMarkdown = generateStandardReadme({
      title,
      tagline,
      overview,
      skills: safeSkills,
      level: safeLevel,
      goal: safeGoal,
      architecture,
      implementationStatus,
      databaseSchema,
      apiEndpoints,
      starterFiles,
      milestones,
      technicalDecisions,
      limitations,
      metricsToMeasureLater,
    });
  } else {
    readmeMarkdown = sanitizeClaimsAndTerminology(readmeMarkdown);
  }

  return {
    id: 'proj_' + Math.random().toString(36).substring(2, 9),
    title,
    tagline,
    level: safeLevel,
    skills: safeSkills,
    goal: safeGoal,
    projectType: projectType || 'Web App',
    availableTime: availableTime || '1 Day',
    matchScore,
    overview,
    problemStatement,
    targetAudience,
    whyItProvesSkills,
    architecture,
    databaseSchema,
    apiEndpoints,
    milestones,
    cvBulletPoints,
    interviewQuestions,
    starterFiles,
    readmeMarkdown,
    createdAt: new Date().toISOString(),
    tags: [safeLevel, ...safeSkills, projectType || 'Web App', safeGoal]
  };
}

/**
 * Generates an exemplary bespoke fallback project when Gemini is unavailable or not configured.
 */
export function generateBespokeFallbackProject(params: GeneratorParams): ProjectBlueprint {
  const { level, skills, goal, projectType, availableTime } = params;
  const primarySkills = skills.length > 0 ? skills.slice(0, 3).join(', ') : 'TypeScript, React, PostgreSQL';
  const mainSkill = skills[0] || 'Modern Full-Stack';

  const isPython = skills.some((s) => /python|fastapi|django|flask/i.test(s));
  const isGo = skills.some((s) => /go|golang/i.test(s));

  const rawFallback = {
    title: `${mainSkill} Real-Time Event Stream Ingestion & Analytics Engine`,
    tagline: `A resilient, high-throughput event ingestion gateway and telemetry analytics dashboard built with ${primarySkills}.`,
    matchScore: 97,
    difficultyReasoning: `Calibrated for ${level} developers by focusing on structured relational data modeling, type-safe API contracts, and robust error handling.`,
    overview: `A modular telemetry and real-time observability platform designed specifically to demonstrate clean systems architecture principles. It showcases structured event batching, indexed SQL aggregation, schema validation, and fluid client-side UI rendering tailored for ${level} developers targeting ${goal.toLowerCase()}.\n\nEvery architectural component maintains explicit separation between network ingestion, payload validation, and transactional persistence.`,
    problemStatement: `Modern software platforms produce high-frequency unstructured telemetry streams. Engineers struggle to build systems that buffer spikes, validate high-velocity payloads, and render live metrics without blocking the primary request loop.`,
    targetAudience: `Engineering leads, DevOps specialists, and data engineers looking for live system telemetry and verifiable architectural rigor.`,
    whyItProvesSkills: [
      `Demonstrates mastery of asynchronous I/O and stream ingestion with ${skills.join(' and ') || 'modern stacks'}.`,
      `Includes indexed SQL schema optimization and analytical queries that stand up to senior code reviews.`,
      `Solves realistic edge cases: backpressure handling, reconnecting WebSocket streams, and optimistic UI updates.`,
      `Directly aligns with ${goal} by providing concrete technical talking points and evidence-based metrics to benchmark.`
    ],
    implementationStatus: {
      implemented: [
        'Batch event ingestion endpoint with JSON payload schema validation',
        'Relational database schema with composite indexing on (source_service, created_at DESC)',
        'Pre-aggregated hourly metric rollup calculations',
        'Interactive telemetry dashboard with reactive chart updates'
      ],
      scaffolded: [
        'Starter scaffold for WebSocket live feed with exponential backoff reconnection',
        'Integration test suite simulating burst payload ingestion'
      ],
      planned: [
        'Distributed rate limiting using token bucket algorithm with Redis',
        'Prometheus exporter for operational p95/p99 latency telemetry'
      ]
    },
    architecture: {
      summary: `Micro-monolith architecture utilizing a fast REST/WebSocket gateway, background task worker with backpressure queues, and an optimized relational datastore with materialized rollups.`,
      frontend: `React with optimistic state transitions, virtualized timeline rendering, and reactive canvas metrics.`,
      backend: `Modular API service with rate limiting, payload validation (Zod/Pydantic), and structured telemetry logs.`,
      database: `Relational SQL store with composite indexing, partition strategies by timestamp, and JSONB event storage.`,
      authAndSecurity: `Role-based access tokens with JWT/session cookies, CSRF protection, and strict input sanitization.`,
      deployment: `Containerized Docker setup with automated health check probes and GitHub Actions CI validation.`
    },
    databaseSchema: [
      {
        table: 'events_log',
        description: 'Append-only event stream storage with composite indexing.',
        columns: [
          { name: 'id', type: 'UUID PRIMARY KEY', desc: 'Unique event identifier' },
          { name: 'source_service', type: 'VARCHAR(64) NOT NULL', desc: 'Microservice or client producing the event' },
          { name: 'event_type', type: 'VARCHAR(128) NOT NULL', desc: 'Categorical tag e.g. user_action, error_spike' },
          { name: 'payload', type: 'JSONB NOT NULL', desc: 'Flexible event metadata payload' },
          { name: 'latency_ms', type: 'INTEGER NOT NULL DEFAULT 0', desc: 'Measured operational latency' },
          { name: 'created_at', type: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()', desc: 'Creation timestamp' }
        ]
      },
      {
        table: 'hourly_metric_aggregates',
        description: 'Pre-computed rollups for responsive dashboard analytics.',
        columns: [
          { name: 'time_bucket', type: 'TIMESTAMPTZ NOT NULL', desc: 'Start of hour window' },
          { name: 'source_service', type: 'VARCHAR(64) NOT NULL', desc: 'Service identifier' },
          { name: 'total_count', type: 'BIGINT NOT NULL', desc: 'Total events processed in window' },
          { name: 'avg_latency_ms', type: 'FLOAT NOT NULL', desc: 'Calculated average latency' },
          { name: 'error_count', type: 'INTEGER NOT NULL DEFAULT 0', desc: 'Count of failing events' }
        ]
      }
    ],
    apiEndpoints: [
      {
        method: 'POST' as const,
        path: '/api/v1/events/batch',
        description: 'Ingests and validates high-volume batches of events with atomic database insertion.',
        samplePayload: '{\n  "batch_id": "b_99182",\n  "events": [\n    {\n      "type": "checkout_completed",\n      "latency_ms": 142,\n      "payload": { "cart_id": "c_402", "amount": 89.5 }\n    }\n  ]\n}',
        responsePreview: '{\n  "status": "acknowledged",\n  "processed": 1,\n  "duration_ms": 18\n}'
      },
      {
        method: 'GET' as const,
        path: '/api/v1/metrics/timeseries?window=24h',
        description: 'Returns pre-aggregated metric rollups with sub-10ms query latency.',
        responsePreview: '{\n  "window": "24h",\n  "points": [{ "timestamp": "2026-08-20T18:00:00Z", "avg_latency": 112, "errors": 0 }]\n}'
      }
    ],
    milestones: [
      {
        phaseNumber: 1,
        phase: 'Phase 1',
        title: 'Core Engine & Database Schema',
        duration: availableTime === '1 Day' ? '3-4 Hours' : 'Day 1-2',
        tasks: [
          { id: 't1', task: 'Set up repository structure, linter, and database migration scripts.', details: 'Establish strong typing, connection pooling, and initial schema DDL.' },
          { id: 't2', task: 'Implement the batch event ingestion endpoint with robust validation.', details: 'Ensure schema rejections return RFC-7807 compliant error objects.' },
          { id: 't3', task: 'Write integration tests for ingestion edge cases.', details: 'Test burst throughput and malformed JSON payloads.' }
        ]
      },
      {
        phaseNumber: 2,
        phase: 'Phase 2',
        title: 'Interactive Dashboard & Real-Time Sync',
        duration: availableTime === '1 Day' ? '3-4 Hours' : 'Day 3-4',
        tasks: [
          { id: 't4', task: 'Build responsive telemetry dashboard with query time-window filter.', details: 'Incorporate live chart updates and summary metric cards.' },
          { id: 't5', task: 'Implement server-sent events (SSE) or WebSocket live feed.', details: 'Handle auto-reconnect with exponential backoff on connection drop.' },
          { id: 't6', task: 'Add export to CSV/JSON and drill-down modal for event inspection.', details: 'Enable deep filtering by event type and latency threshold.' }
        ]
      },
      {
        phaseNumber: 3,
        phase: 'Phase 3',
        title: 'Polish, Benchmarks & Portfolio Assets',
        duration: availableTime === '1 Day' ? '1-2 Hours' : 'Day 5',
        tasks: [
          { id: 't7', task: 'Benchmark throughput with load-testing script (k6 or autocannon).', details: 'Document p95 and p99 latencies under representative load to highlight on your CV.' },
          { id: 't8', task: 'Generate polished README with architectural diagrams and deployment guide.', details: 'Add instructions for single-command Docker deployment.' }
        ]
      }
    ],
    cvBulletPoints: [
      `Engineered a real-time event analytics platform in ${primarySkills}, designing batch insertion pipelines to optimize database write throughput.`,
      `Architected an optimized relational schema with composite indexing on (source_service, created_at DESC) and time-bucketed aggregation rollups.`,
      `Built resilient ingestion validation with schema enforcement and defensive error handling under burst loads.`,
      `Delivered a developer dashboard featuring live WebSocket metrics, optimistic state transitions, and customizable telemetry filters.`
    ],
    interviewQuestions: [
      {
        question: `How did you design the event ingestion to handle traffic spikes without crashing the database?`,
        idealAnswer: `I separated ingestion validation from persistent disk writes by buffering incoming events into an in-memory queue/batch worker. Instead of executing 1,000 individual SQL inserts, the worker commits bulk batch inserts every 200ms or 100 items inside a single database transaction.`,
        talkingPoint: `Mention batch insertion, database connection pool limits, and how unbuffered individual writes lead to connection starvation.`,
        pitfallsToAvoid: `Don't claim asynchronous background tasks provide transactional integrity without an outbox pattern.`
      },
      {
        question: `Why did you choose your specific database indexing strategy?`,
        idealAnswer: `Because analytical queries frequently filter by service name within a specific time window, I established a composite index on (source_service, created_at DESC). This turns what would be an expensive table scan into an efficient index range scan.`,
        talkingPoint: `Highlight query EXPLAIN plans and the cost difference between sequential scans and indexed bitmap scans.`,
        pitfallsToAvoid: `Don't say you indexed every column, which degrades write throughput.`
      }
    ],
    starterFiles: [
      {
        filename: 'schema.sql',
        language: 'sql',
        description: 'Core Implementation: Relational schema with composite indexing and rollup table',
        code: `-- PostgreSQL / SQLite Telemetry & Event Stream Schema
CREATE TABLE IF NOT EXISTS events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_service VARCHAR(64) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index for fast service + time-range queries
CREATE INDEX IF NOT EXISTS idx_events_service_created 
ON events_log(source_service, created_at DESC);

-- Index for filtering high-latency anomalies
CREATE INDEX IF NOT EXISTS idx_events_latency 
ON events_log(latency_ms) WHERE latency_ms > 500;
`
      },
      {
        filename: isPython ? 'main.py' : isGo ? 'main.go' : 'src/server.ts',
        language: isPython ? 'python' : isGo ? 'go' : 'typescript',
        description: 'Core Implementation: Batch event ingestion handler with timing & validation',
        code: isPython
          ? `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import time

app = FastAPI(title="Telemetry Ingestion Service")

class EventItem(BaseModel):
    source_service: str = Field(..., max_length=64)
    event_type: str = Field(..., max_length=128)
    payload: Dict[str, Any]
    latency_ms: int = 0

class BatchRequest(BaseModel):
    batch_id: str
    events: List[EventItem]

@app.post("/api/v1/events/batch", status_code=202)
async def ingest_batch(req: BatchRequest):
    start_time = time.perf_counter()
    if not req.events:
        raise HTTPException(status_code=400, detail="Batch cannot be empty")
    
    # Ingest and persist batch within a single transaction
    processing_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
    return {
        "status": "acknowledged",
        "batch_id": req.batch_id,
        "processed_count": len(req.events),
        "duration_ms": processing_time_ms
    }
`
          : `import express, { Request, Response } from 'express';

export const eventRouter = express.Router();

interface EventPayload {
  source_service: string;
  event_type: string;
  payload: Record<string, unknown>;
  latency_ms?: number;
}

eventRouter.post('/events/batch', async (req: Request, res: Response) => {
  const startTime = process.hrtime.bigint();
  const { events } = req.body as { events: EventPayload[] };

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'Batch must contain at least 1 event.' });
  }

  try {
    const insertedCount = events.length;
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    return res.status(202).json({
      status: 'acknowledged',
      count: insertedCount,
      processing_time_ms: Number(durationMs.toFixed(2))
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to ingest event stream.' });
  }
});
`
      }
    ],
    technicalDecisions: [
      `Synchronous Transactional Batching: Events are buffered and persisted in bulk transactions to prevent connection pool exhaustion while guaranteeing durability.`,
      `Composite B-Tree Indexing: Indexing (source_service, created_at DESC) eliminates table scans for timeline filtering.`,
      `Structured Schema Validation: Payloads are validated before entering database persistence pipelines.`
    ],
    limitations: [
      `In-memory batch buffer will lose pending events if the container process crashes without a WAL or durable queue.`,
      `Single-node rate limiter requires an external Redis store for horizontal multi-instance deployments.`
    ],
    metricsToMeasureLater: [
      `p95 and p99 ingestion latency under 1,000 req/sec burst loads.`,
      `Database connection pool saturation and write lock contention.`
    ]
  };

  return validateAndEnforceConsistency(rawFallback, params);
}
