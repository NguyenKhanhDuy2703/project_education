import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_TOPIC_TAGS,
  getSystemTopicTags,
  saveSystemTopicTags,
  normalizeTopicKey,
  getTopicTag,
  getTopicTitle,
  getTopicBadgeClass,
  TOPIC_KEY_ALIASES,
} from '@/services/topicTags.service';

describe('Topic Tags Service Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Default Topic Tags & Localization', () => {
    it('contains all canonical system topics with English titles and descriptions', () => {
      expect(DEFAULT_TOPIC_TAGS.length).toBeGreaterThanOrEqual(5);

      const keys = DEFAULT_TOPIC_TAGS.map((t) => t.key);
      expect(keys).toContain('testing');
      expect(keys).toContain('database');
      expect(keys).toContain('backend');
      expect(keys).toContain('devops');
      expect(keys).toContain('security');

      for (const tag of DEFAULT_TOPIC_TAGS) {
        expect(tag.title).toBeTruthy();
        expect(tag.tagColor).toBeTruthy();
        expect(tag.description).toBeTruthy();
        // Verify no legacy Vietnamese words present
        expect(tag.title).not.toMatch(/(Kiểm thử|Cơ sở dữ liệu|Hạ tầng|Bảo mật)/i);
        expect(tag.description).not.toMatch(/(truy vấn|chỉ mục|kiểm tra|bảo vệ)/i);
      }
    });
  });

  describe('Topic Key Normalization & Aliases', () => {
    it('contains expected key aliases mapping', () => {
      expect(TOPIC_KEY_ALIASES['sql']).toBe('database');
      expect(TOPIC_KEY_ALIASES['docker']).toBe('devops');
      expect(TOPIC_KEY_ALIASES['qa']).toBe('testing');
    });

    it('handles empty or undefined inputs gracefully', () => {
      expect(normalizeTopicKey('')).toBe('');
      expect(normalizeTopicKey(undefined)).toBe('');
    });

    it('resolves known aliases to canonical keys', () => {
      expect(normalizeTopicKey('sql')).toBe('database');
      expect(normalizeTopicKey('db')).toBe('database');
      expect(normalizeTopicKey('docker')).toBe('devops');
      expect(normalizeTopicKey('qa')).toBe('testing');
      expect(normalizeTopicKey('tester')).toBe('testing');
      expect(normalizeTopicKey('test')).toBe('testing');
      expect(normalizeTopicKey('auth')).toBe('security');
      expect(normalizeTopicKey('sec')).toBe('security');
    });

    it('normalizes casing and whitespace', () => {
      expect(normalizeTopicKey('  SQL  ')).toBe('database');
      expect(normalizeTopicKey('DevOps')).toBe('devops');
      expect(normalizeTopicKey('  Custom-Topic ')).toBe('custom-topic');
    });

    it('preserves unmapped topics as lowercased tokens', () => {
      expect(normalizeTopicKey('frontend')).toBe('frontend');
      expect(normalizeTopicKey('algorithms')).toBe('algorithms');
    });
  });

  describe('Storage & Persistence', () => {
    it('returns default tags when storage is empty', () => {
      const tags = getSystemTopicTags();
      expect(tags).toEqual(DEFAULT_TOPIC_TAGS);
    });

    it('persists and loads custom tags from localStorage', () => {
      const custom = [
        {
          key: 'cloud',
          title: 'Cloud Architecture',
          description: 'AWS, Azure, and GCP distributed setups.',
          tagColor: 'border-cyan-500/30 text-cyan-600 bg-cyan-500/10',
        },
      ];

      const listener = vi.fn();
      window.addEventListener('studyweb:topic-tags-updated', listener);

      saveSystemTopicTags(custom);

      expect(getSystemTopicTags()).toEqual(custom);
      expect(listener).toHaveBeenCalledTimes(1);

      window.removeEventListener('studyweb:topic-tags-updated', listener);
    });

    it('handles corrupted JSON in localStorage gracefully without throwing', () => {
      localStorage.setItem('studyweb_system_topic_tags', '{invalid:json');
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const tags = getSystemTopicTags();
      expect(tags).toEqual(DEFAULT_TOPIC_TAGS);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Lookup & Badges', () => {
    it('retrieves tag metadata by canonical key or alias', () => {
      const byKey = getTopicTag('database');
      expect(byKey?.title).toBe('Database & SQL');

      const byAlias = getTopicTag('sql');
      expect(byAlias?.title).toBe('Database & SQL');
    });

    it('returns undefined for non-existent tag', () => {
      expect(getTopicTag('non-existent')).toBeUndefined();
    });

    it('formats topic title correctly with fallbacks', () => {
      expect(getTopicTitle('database')).toBe('Database & SQL');
      expect(getTopicTitle('sql')).toBe('Database & SQL');
      expect(getTopicTitle('custom-tool')).toBe('Custom-tool');
      expect(getTopicTitle(undefined, 'Fallback')).toBe('Fallback');
    });

    it('returns custom or fallback badge styling class', () => {
      const dbBadge = getTopicBadgeClass('database');
      expect(dbBadge).toContain('border-blue-500');

      const fallbackBadge = getTopicBadgeClass('unknown');
      expect(fallbackBadge).toBe('border-border text-muted-foreground bg-muted/40');
    });
  });
});
