import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SeriesService,
  CANONICAL_TOPICS,
  TOPIC_KEY_ALIASES,
  normalizeTopicKey,
} from '../src/modules/series/series.service';

describe('PB-25: Shared Topic Taxonomy Synchronized Contract Suite', () => {
  it('defines the 5 canonical system topics with keys matching FE and Admin', () => {
    const keys = CANONICAL_TOPICS.map((t) => t.key);
    assert.deepEqual(keys, ['testing', 'database', 'backend', 'devops', 'security']);

    for (const topic of CANONICAL_TOPICS) {
      assert.ok(topic.title, `Topic "${topic.key}" must have a title`);
      assert.ok(topic.description, `Topic "${topic.key}" must have a description`);
      assert.ok(topic.tagColor, `Topic "${topic.key}" must have a tagColor class`);
    }
  });

  it('resolves legacy and shorthand aliases to canonical topic keys', () => {
    assert.equal(normalizeTopicKey('sql'), 'database');
    assert.equal(normalizeTopicKey('db'), 'database');
    assert.equal(normalizeTopicKey('docker'), 'devops');
    assert.equal(normalizeTopicKey('qa'), 'testing');
    assert.equal(normalizeTopicKey('tester'), 'testing');
    assert.equal(normalizeTopicKey('test'), 'testing');
    assert.equal(normalizeTopicKey('auth'), 'security');
    assert.equal(normalizeTopicKey('sec'), 'security');
  });

  it('handles case-insensitivity and whitespace when normalizing topics', () => {
    assert.equal(normalizeTopicKey('  SQL  '), 'database');
    assert.equal(normalizeTopicKey('DOCKER'), 'devops');
    assert.equal(normalizeTopicKey('Backend'), 'backend');
  });

  it('falls back gracefully to testing when category is empty or undefined', () => {
    assert.equal(normalizeTopicKey(''), 'testing');
    assert.equal(normalizeTopicKey(undefined), 'testing');
  });

  it('SeriesService.getTaxonomyTopics returns canonical topics', () => {
    const service = new SeriesService({} as any);
    const topics = service.getTaxonomyTopics();
    assert.equal(topics.length, 5);
    assert.equal(topics[0].key, 'testing');
  });
});
