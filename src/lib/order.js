export function buildOrderPayload({ region, material, price, quantity, retention }) {
  return {
    createdAt: new Date().toISOString(),
    region: {
      id: region.id,
      name: region.name,
    },
    item: {
      id: material.id,
      name: material.name,
      category: material.category,
      quantity,
      unitPrice: price,
      totalPrice: price * quantity,
    },
    retention: retention
      ? {
          applied: true,
          type: retention.type,
          originalUnitPrice: retention.originalPrice ?? null,
          discountPercent: retention.discountPercent ?? null,
        }
      : { applied: false },
  };
}

export function downloadOrderJson(order) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `order-${timestamp}.json`;
  const blob = new Blob([JSON.stringify(order, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return filename;
}
