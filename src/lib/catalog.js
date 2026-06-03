import catalog from '../data/catalog.json';

export function getCatalog() {
  return catalog;
}

export function getRegions() {
  return catalog.regions;
}

export function getPrice(material, regionId) {
  const price = material.prices[regionId];
  if (price === undefined) {
    throw new Error(`Цена для региона ${regionId} не найдена`);
  }
  return price;
}

export function getMaterialsForRegion(regionId) {
  return catalog.materials.map((material) => ({
    ...material,
    price: getPrice(material, regionId),
  }));
}

export function findCheapestInCategory(category, regionId) {
  const inCategory = catalog.materials.filter((m) => m.category === category);
  if (inCategory.length === 0) {
    return null;
  }

  return inCategory.reduce((cheapest, current) => {
    const currentPrice = getPrice(current, regionId);
    const cheapestPrice = getPrice(cheapest, regionId);
    return currentPrice < cheapestPrice ? current : cheapest;
  });
}

export function getCategories() {
  return [...new Set(catalog.materials.map((m) => m.category))];
}
