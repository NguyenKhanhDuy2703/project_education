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
    description: 'Kiểm thử thủ công, kiểm thử tự động API, regression testing và unit tests.',
    tagColor: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  },
  {
    key: 'database',
    title: 'Database & SQL',
    description: 'Mô hình hóa dữ liệu quan hệ, SQL query, indexing, transactions và tối ưu hóa.',
    tagColor: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10',
  },
  {
    key: 'backend',
    title: 'Backend API',
    description: 'Kiến trúc RESTful API, authentication JWT, microservices và server logic.',
    tagColor: 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10',
  },
  {
    key: 'devops',
    title: 'DevOps & Docker',
    description: 'Container hóa ứng dụng, Docker Compose đa dịch vụ, CI/CD pipelines.',
    tagColor: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
  },
  {
    key: 'security',
    title: 'Security & Auth',
    description: 'Bảo mật ứng dụng web, OAuth2, RBAC phân quyền và mã hóa dữ liệu.',
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
    console.error('Lỗi đọc system topic tags:', err);
  }
  return DEFAULT_TOPIC_TAGS;
}

export function saveSystemTopicTags(tags: TopicTag[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
    // Trigger window event so all listeners update reactively
    window.dispatchEvent(new CustomEvent('studyweb:topic-tags-updated', { detail: tags }));
  } catch (err) {
    console.error('Lỗi lưu system topic tags:', err);
  }
}
