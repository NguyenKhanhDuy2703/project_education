export interface TopicTag {
  key: string;
  title: string;
  description?: string;
  tagColor: string;
}

export const DEFAULT_TOPIC_TAGS: TopicTag[] = [
  {
    key: 'testing',
    title: 'Tester & QA',
    description: 'Manual testing, automated API testing, regression suites, and unit assertions.',
    tagColor: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  },
  {
    key: 'database',
    title: 'Database & SQL',
    description: 'Relational data modeling, SQL queries, indexing, transactions, and performance tuning.',
    tagColor: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10',
  },
  {
    key: 'backend',
    title: 'Backend API',
    description: 'RESTful API architecture, JWT authentication, microservices, and server business logic.',
    tagColor: 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10',
  },
  {
    key: 'devops',
    title: 'DevOps & Docker',
    description: 'Application containerization, multi-service Docker Compose, and CI/CD pipelines.',
    tagColor: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
  },
  {
    key: 'security',
    title: 'Security & Auth',
    description: 'Web application security, OAuth2, RBAC/PBAC access controls, and data encryption.',
    tagColor: 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10',
  },
];

const STORAGE_KEY = 'studyweb_system_topic_tags';

export function getSystemTopicTags(): TopicTag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read system topic tags:', err);
  }
  return DEFAULT_TOPIC_TAGS;
}

export function saveSystemTopicTags(tags: TopicTag[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
    // Trigger window event so all listeners update reactively
    window.dispatchEvent(new CustomEvent('studyweb:topic-tags-updated', { detail: tags }));
  } catch (err) {
    console.error('Failed to save system topic tags:', err);
  }
}

export const TOPIC_KEY_ALIASES: Record<string, string> = {
  sql: 'database',
  db: 'database',
  docker: 'devops',
  qa: 'testing',
  tester: 'testing',
  test: 'testing',
  auth: 'security',
  sec: 'security',
};

export function normalizeTopicKey(key?: string): string {
  if (!key) return '';
  const lower = key.toLowerCase().trim();
  return TOPIC_KEY_ALIASES[lower] || lower;
}

export function getTopicTag(key?: string): TopicTag | undefined {
  if (!key) return undefined;
  const normalized = normalizeTopicKey(key);
  const tags = getSystemTopicTags();
  return tags.find((t) => t.key.toLowerCase() === normalized);
}

export function getTopicTitle(key?: string, fallback = 'Topic'): string {
  if (!key) return fallback;
  const tag = getTopicTag(key);
  if (tag) return tag.title;
  const norm = normalizeTopicKey(key);
  return norm.charAt(0).toUpperCase() + norm.slice(1);
}

export function getTopicBadgeClass(key?: string): string {
  const tag = getTopicTag(key);
  return tag?.tagColor || 'border-border text-muted-foreground bg-muted/40';
}

