/**
 * In-memory inventory provider.
 *
 * Simulates flight and hotel availability with mutable stock counters.
 * Stock is decremented on booking and restored on failure/cancellation.
 *
 * In production this would be replaced by calls to an external GDS/OTA API.
 * The interface (getFlights, getHotels, lockItem, releaseItem) stays the same.
 */

const logger = require('../utils/logger');

// ── Flight inventory ─────────────────────────────────────────────────────────

const flights = [
  {
    id: 'FL-DEL-BLR-001',
    from: 'DEL',
    to: 'BLR',
    airline: 'IndiGo',
    class: 'economy',
    price: 5500,
    currency: 'INR',
    departureTime: '06:00',
    availableSeats: 40,
  },
  {
    id: 'FL-DEL-BLR-002',
    from: 'DEL',
    to: 'BLR',
    airline: 'Air India',
    class: 'premium_economy',
    price: 9200,
    currency: 'INR',
    departureTime: '10:30',
    availableSeats: 15,
  },
  {
    id: 'FL-DEL-BOM-001',
    from: 'DEL',
    to: 'BOM',
    airline: 'Vistara',
    class: 'economy',
    price: 4800,
    currency: 'INR',
    departureTime: '08:15',
    availableSeats: 55,
  },
  {
    id: 'FL-BLR-DEL-001',
    from: 'BLR',
    to: 'DEL',
    airline: 'IndiGo',
    class: 'economy',
    price: 5200,
    currency: 'INR',
    departureTime: '19:00',
    availableSeats: 30,
  },
  {
    id: 'FL-BOM-DEL-001',
    from: 'BOM',
    to: 'DEL',
    airline: 'SpiceJet',
    class: 'economy',
    price: 3900,
    currency: 'INR',
    departureTime: '14:45',
    availableSeats: 2,
  },
];

// ── Hotel inventory ──────────────────────────────────────────────────────────

const hotels = [
  {
    id: 'HT-BLR-001',
    city: 'Bangalore',
    name: 'Lemon Tree Premier',
    type: 'standard',
    pricePerNight: 3500,
    currency: 'INR',
    availableRooms: 20,
  },
  {
    id: 'HT-BLR-002',
    city: 'Bangalore',
    name: 'Taj MG Road',
    type: 'luxury',
    pricePerNight: 8500,
    currency: 'INR',
    availableRooms: 5,
  },
  {
    id: 'HT-BOM-001',
    city: 'Mumbai',
    name: 'Trident Nariman Point',
    type: 'business',
    pricePerNight: 6200,
    currency: 'INR',
    availableRooms: 12,
  },
  {
    id: 'HT-DEL-001',
    city: 'Delhi',
    name: 'Holiday Inn Aerocity',
    type: 'standard',
    pricePerNight: 4000,
    currency: 'INR',
    availableRooms: 25,
  },
  {
    id: 'HT-DEL-002',
    city: 'Delhi',
    name: 'The Leela Palace',
    type: 'luxury',
    pricePerNight: 12000,
    currency: 'INR',
    availableRooms: 1,
  },
];

// ── Stock operations ─────────────────────────────────────────────────────────

function findItem(inventoryId) {
  return (
    flights.find((f) => f.id === inventoryId) ||
    hotels.find((h) => h.id === inventoryId) ||
    null
  );
}

function getStockKey(item) {
  if ('availableSeats' in item) return 'availableSeats';
  if ('availableRooms' in item) return 'availableRooms';
  return null;
}

/**
 * Attempt to decrement stock for an inventory item.
 * @returns {{ success: boolean, item: Object|null, error: string|null }}
 */
function lockItem(inventoryId) {
  const item = findItem(inventoryId);
  if (!item) {
    return { success: false, item: null, error: 'Inventory item not found' };
  }

  const stockKey = getStockKey(item);
  if (!stockKey || item[stockKey] <= 0) {
    return {
      success: false,
      item,
      error: `No availability for ${inventoryId} (${stockKey}: ${item[stockKey]})`,
    };
  }

  item[stockKey] -= 1;
  logger.debug(`Inventory lock: ${inventoryId} ${stockKey} → ${item[stockKey]}`);
  return { success: true, item, error: null };
}

/**
 * Restore stock for an inventory item (compensation on failure/cancel).
 */
function releaseItem(inventoryId) {
  const item = findItem(inventoryId);
  if (!item) return;

  const stockKey = getStockKey(item);
  if (stockKey) {
    item[stockKey] += 1;
    logger.debug(
      `Inventory release: ${inventoryId} ${stockKey} → ${item[stockKey]}`
    );
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

function getFlights() {
  return flights.map((f) => ({ ...f }));
}

function getHotels() {
  return hotels.map((h) => ({ ...h }));
}

module.exports = {
  getFlights,
  getHotels,
  findItem,
  lockItem,
  releaseItem,
};
