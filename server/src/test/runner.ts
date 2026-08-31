import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../db.js';
import { SkuMaster } from '../models/SkuMaster.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { Grn } from '../models/Grn.js';
import { Invoice } from '../models/Invoice.js';
import { resolveLineItemSku } from '../services/masterResolutionService.js';
import { computeThreeWayMatch } from '../services/matchEngine.js';
import { seedSkuMasterCatalogue, seedSampleDocuments } from '../seed.js';

async function runTests() {
  console.log('🧪 Starting Three-Way Match Engine Automated Test Suite...\n');
  await connectDB();

  try {
    // Clear collections for clean test
    await SkuMaster.deleteMany({});
    await PurchaseOrder.deleteMany({});
    await Grn.deleteMany({});
    await Invoice.deleteMany({});

    // Test 1: Seed SKU Master Catalogue & Sample Docs
    console.log('Test 1: Seeding initial catalogue and sample documents...');
    await seedSkuMasterCatalogue();
    await seedSampleDocuments();

    const skuCount = await SkuMaster.countDocuments();
    console.log(`✅ Seeded ${skuCount} SKU Master entries.`);
    if (skuCount === 0) throw new Error('Failed to seed SKU Master entries');

    // Test 2: Master SKU Resolution by ERP Code & EAN Code (case insensitive & trimmed)
    console.log('\nTest 2: Testing SKU Master Resolution...');
    const matchErp = await resolveLineItemSku(' 11423 ');
    console.log('ERP Match result:', matchErp ? `${matchErp.skuErpCode} -> ${matchErp.name}` : 'FAILED');
    if (!matchErp || matchErp.skuErpCode !== '11423') throw new Error('ERP resolution failed');

    const matchEan = await resolveLineItemSku('fg-p-f-0503');
    console.log('EAN Match result:', matchEan ? `${matchEan.skuErpCode} -> ${matchEan.name}` : 'FAILED');
    if (!matchEan || matchEan.skuErpCode !== '11423') throw new Error('EAN resolution failed');

    const unmappedMatch = await resolveLineItemSku('NON-EXISTENT-SKU-999');
    console.log('Unmapped test result:', unmappedMatch === null ? 'Correctly returned null' : 'FAILED');
    if (unmappedMatch !== null) throw new Error('Unmapped resolution failed');

    // Test 3: Three-Way Match Engine Calculation on CI4PO05788
    console.log('\nTest 3: Testing Three-Way Match Engine on CI4PO05788...');
    const result = await computeThreeWayMatch('CI4PO05788');
    console.log(`Match Status: ${result.status}`);
    console.log(`Overall Reason Codes: ${JSON.stringify(result.overallReasons)}`);
    console.log(`Items Reconciled: ${result.itemMatches.length}`);

    if (!result.status) throw new Error('Match computation failed to return status');
    console.log('✅ Three-Way Match Engine completed successfully.');

    // Test 4: Duplicate PO Test
    console.log('\nTest 4: Testing Duplicate PO Detection...');
    const duplicatePo = new PurchaseOrder({
      poNumber: 'CI4PO05788',
      poDate: new Date('2026-03-17'),
      vendorName: 'Duplicate Vendor',
      items: [],
      rawParsed: {},
      filePath: '',
      originalFilename: 'duplicate.pdf',
    });
    await duplicatePo.save();

    const dupResult = await computeThreeWayMatch('CI4PO05788');
    console.log('Duplicate PO Reasons:', dupResult.overallReasons);
    if (!dupResult.overallReasons.includes('duplicate_po')) {
      throw new Error('Failed to flag duplicate_po');
    }
    console.log('✅ Duplicate PO successfully detected and flagged.');

    console.log('\n🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

runTests();
