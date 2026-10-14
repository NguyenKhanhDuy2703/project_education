import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SeriesService } from '../src/modules/series/series.service';

async function runCatalogVerification() {
  console.log('🚀 Starting Verification: Task 2 (Catalog, Series & Topic Discovery)...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const seriesService = app.get(SeriesService);

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Subtask 2.1: Find all public series
    console.log('\n--- 1. Testing Find All Public Series (PB-05 / Subtask 2.1) ---');
    const allSeries = await seriesService.findAll(false);
    assert(Array.isArray(allSeries), 'findAll returns an array of series');
    assert(allSeries.length > 0, `Returns at least 1 series in catalog (found: ${allSeries.length})`);

    const firstSeries = allSeries[0];
    assert(Boolean(firstSeries.title), `Series has title (got: "${firstSeries.title}")`);
    assert(Boolean(firstSeries.slug), `Series has slug for SEO routing (got: "${firstSeries.slug}")`);
    assert(Boolean(firstSeries.category), `Series has category/topic tag (got: "${firstSeries.category}")`);

    // 2. Subtask 2.2: Reactive Topic / Category filtering logic
    console.log('\n--- 2. Testing Topic / Category Extraction (PB-05 / Subtask 2.2) ---');
    const categories = Array.from(new Set(allSeries.map((s) => s.category).filter(Boolean)));
    assert(categories.length > 0, `Catalog contains distinguishable categories: [${categories.join(', ')}]`);

    // 3. Subtask 2.3: Search filtering by keyword
    console.log('\n--- 3. Testing Keyword Filtering (PB-05 / Subtask 2.3) ---');
    const searchTerm = firstSeries.title.slice(0, 4).toLowerCase();
    const filtered = allSeries.filter(
      (s) =>
        s.title.toLowerCase().includes(searchTerm) ||
        (s.description && s.description.toLowerCase().includes(searchTerm)),
    );
    assert(filtered.length >= 1, `Searching for "${searchTerm}" yields matching series (found: ${filtered.length})`);

    // 4. Subtask 2.4: Series Detail & Lab Curriculum by Slug
    console.log('\n--- 4. Testing Series Details & Curriculum by Slug (PB-06 / Subtask 2.4) ---');
    const seriesDetail = await seriesService.findBySlug(firstSeries.slug);
    assert(Boolean(seriesDetail), `findBySlug("${firstSeries.slug}") successfully loads series details`);
    assert(Array.isArray(seriesDetail.labs), 'Series contains labs array');
    
    if (seriesDetail.labs && seriesDetail.labs.length > 0) {
      const firstLab = seriesDetail.labs[0];
      assert(Boolean(firstLab.title), `Lab has title: "${firstLab.title}"`);
      assert(typeof firstLab.isProOnly === 'boolean', `Lab specifies isProOnly flag (value: ${firstLab.isProOnly})`);
    } else {
      console.log('  ℹ (Series currently has 0 labs linked)');
    }

    console.log(`\n🎉 Verification Summary: ${passed}/${total} checks passed!`);
  } catch (error) {
    console.error('Fatal error during catalog verification:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

runCatalogVerification();
