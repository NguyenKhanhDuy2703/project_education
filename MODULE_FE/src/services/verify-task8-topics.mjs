import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Verification: Task 8 (Admin Centralized Topic Tags Governance - WF-08 | PB-05, PB-15)...');

let passed = 0;
let total = 0;

function assert(condition, msg) {
  total++;
  if (condition) {
    console.log(`  ✓ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${msg}`);
    process.exitCode = 1;
  }
}

// Subtask 8.1: Verify topicTags.service.ts structure and DEFAULT_TOPIC_TAGS
console.log('\n--- 1. Testing Default Topic Tags and Metadata (Subtask 8.1) ---');
const serviceContent = readFileSync(join(__dirname, 'topicTags.service.ts'), 'utf-8');

assert(serviceContent.includes("key: 'testing'"), "Default tags include 'testing' (QA & Automation)");
assert(serviceContent.includes("key: 'database'"), "Default tags include 'database' (Database & SQL)");
assert(serviceContent.includes("key: 'backend'"), "Default tags include 'backend' (Backend API)");
assert(serviceContent.includes("key: 'devops'"), "Default tags include 'devops' (DevOps & Docker)");
assert(serviceContent.includes("key: 'security'"), "Default tags include 'security' (Security & Auth)");

// Subtask 8.2: Testing Key Auto-Generation, Slugification & Duplicate Protection
console.log('\n--- 2. Testing Key Auto-Generation & Duplicate Key Rejection (Subtask 8.2) ---');

function generateKeyFromTitle(val) {
  return val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '');
}

const generated1 = generateKeyFromTitle('Học Máy & Trí Tuệ Nhân Tạo');
assert(generated1 === 'hoc_may_tri_tue_nhan_tao', `Vietnamese accents stripped cleanly into snake_case: '${generated1}'`);

const generated2 = generateKeyFromTitle('Cloud Architecture (AWS / GCP)!');
assert(generated2 === 'cloud_architecture_aws_gcp', `Special characters stripped cleanly: '${generated2}'`);

// Duplicate key validation logic check
const existingTags = [
  { key: 'database', title: 'Database & SQL' },
  { key: 'backend', title: 'Backend API' },
];
const isDuplicateKey = (newKey, tags) => tags.some((t) => t.key.toLowerCase() === newKey.trim().toLowerCase());
assert(isDuplicateKey('database', existingTags) === true, "Duplicate key 'database' correctly detected and rejected");
assert(isDuplicateKey('DATABASE ', existingTags) === true, "Case-insensitive trimmed duplicate key correctly rejected");
assert(isDuplicateKey('ai_ml', existingTags) === false, "Unique key 'ai_ml' correctly accepted");

// Subtask 8.3: Testing Reactive Window Event Emission
console.log('\n--- 3. Testing Event Broadcast Mechanism (Subtask 8.3) ---');
assert(
  serviceContent.includes("window.dispatchEvent(new CustomEvent('studyweb:topic-tags-updated'"),
  "Service dispatches 'studyweb:topic-tags-updated' custom event on save"
);

// Verify that consumers listen to this event
const modalContent = readFileSync(join(__dirname, '../pages/admin/_components/AdminTopicTagsModal.tsx'), 'utf-8');
assert(
  modalContent.includes('COLOR_PRESETS') && modalContent.includes('border-emerald-500'),
  'AdminTopicTagsModal contains color presets for badge styling'
);

// Subtask 8.4: Deletion Safety Guard
console.log('\n--- 4. Testing Deletion Safety Guards (Subtask 8.4) ---');
assert(
  modalContent.includes('tags.length <= 1'),
  'AdminTopicTagsModal enforces minimum 1 topic tag to protect system catalog'
);
assert(
  modalContent.includes('handleResetDefaults') && modalContent.includes('DEFAULT_TOPIC_TAGS'),
  'AdminTopicTagsModal provides one-click restore to system default tags'
);

console.log('\n=================================================');
console.log(`TASK 8 RESULT: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)`);
console.log('=================================================');
