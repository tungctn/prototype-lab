export default function loadAppConfig() {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT) || 8001,
    DATABASE_URL: process.env.DATABASE_URL,
    TYPEORM_SYNCHRONIZE: process.env.TYPEORM_SYNCHRONIZE === 'true',
    TYPEORM_LOGGING: process.env.TYPEORM_LOGGING === 'true',
    REDIS_URL: process.env.REDIS_URL,
    REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX || undefined,
    DEMO: {
      WORKSPACE_NAME: process.env.DEMO_WORKSPACE_NAME || 'SNDQ Demo Workspace',
      REPO_NAME: process.env.DEMO_REPO_NAME || 'sndq-fe',
      REPO_URL: process.env.DEMO_REPO_URL || null,
      PROTOTYPE_ROOT:
        process.env.DEMO_PROTOTYPE_ROOT ||
        '/Users/mac/Workspace/sndq/sndq/sndq-fe/src/app/(prototype)/prototype',
      PUBLIC_PROTOTYPE_BASE:
        process.env.DEMO_PUBLIC_PROTOTYPE_BASE || '/prototype',
    },
    GITHUB: {
      TOKEN: process.env.GITHUB_TOKEN,
    },
    OPENAI: {
      API_KEY: process.env.OPENAI_API_KEY,
      MODEL: process.env.OPENAI_MODEL || 'gpt-5.5',
      TIMEOUT_MS: Number(process.env.OPENAI_TIMEOUT_MS) || 60000,
    },
    AGENT: {
      COMMAND: process.env.AGENT_COMMAND || 'codex',
      MODEL: process.env.AGENT_MODEL || undefined,
      FRONTEND_REPO_PATH:
        process.env.FRONTEND_REPO_PATH ||
        '/Users/mac/Workspace/sndq/sndq/sndq-fe',
      SANDBOX_FORK_SKILL_PATH:
        process.env.SANDBOX_FORK_SKILL_PATH ||
        '/Users/mac/Workspace/sndq/sndq/sndq-fe/.claude/skills/sandbox-fork/SKILL.md',
    },
  };
}

export type AppConfig = ReturnType<typeof loadAppConfig>;
