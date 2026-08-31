import { SkuMaster, ISkuMaster } from '../models/SkuMaster.js';

export async function resolveLineItemSku(itemCode: string): Promise<ISkuMaster | null> {
  if (!itemCode) return null;
  const cleanCode = itemCode.trim();
  const lowerCode = cleanCode.toLowerCase();

  // Find all SKU master entries
  const allSkus = await SkuMaster.find({});

  // 1. Try skuErpCode match (case-insensitive, trimmed)
  let found = allSkus.find((sku) => sku.skuErpCode.trim().toLowerCase() === lowerCode);

  // 2. If not found, try eanCode match
  if (!found) {
    found = allSkus.find((sku) => sku.eanCode && sku.eanCode.trim().toLowerCase() === lowerCode);
  }

  return found || null;
}

export async function resolveDocumentItems(items: Array<{ itemCode: string; skuMaster?: any }>): Promise<Array<any>> {
  const resolvedItems = [];

  for (const item of items) {
    const sku = await resolveLineItemSku(item.itemCode);
    resolvedItems.push({
      ...item,
      skuMaster: sku ? sku._id : null,
    });
  }

  return resolvedItems;
}
