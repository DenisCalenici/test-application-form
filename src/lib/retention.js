import { findCheapestInCategory, getPrice } from './catalog.js';

const DISCOUNT_PERCENT = 5;

export function buildRetentionOffer(selectedMaterial, regionId) {
  const selectedPrice = getPrice(selectedMaterial, regionId);
  const cheapest = findCheapestInCategory(selectedMaterial.category, regionId);
  const cheapestPrice = getPrice(cheapest, regionId);

  if (cheapest.id === selectedMaterial.id) {
    const discountedPrice = Math.round(selectedPrice * (1 - DISCOUNT_PERCENT / 100));
    return {
      type: 'discount',
      material: selectedMaterial,
      price: discountedPrice,
      originalPrice: selectedPrice,
      discountPercent: DISCOUNT_PERCENT,
    };
  }

  return {
    type: 'cheaper_alternative',
    material: cheapest,
    price: cheapestPrice,
    originalPrice: selectedPrice,
    previousMaterial: selectedMaterial,
  };
}
