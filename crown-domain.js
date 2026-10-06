// Contract validators operate on JSON records; they never coerce wire values.
export const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const isText = value => typeof value === 'string' && value.trim().length > 0 && value === value.trim();
export const isInteger = value => Number.isSafeInteger(value);
export const isTimestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const text = isText;
const integer = isInteger;
const nonnegative = value => integer(value) && value >= 0;
const oneOf = (...values) => value => values.includes(value);
const texts = value => Array.isArray(value) && value.every(text);

// References describe existing world records, not permission to invent canon.
export const DOMAIN_SCHEMAS = Object.freeze({
  properties: { id: text, ownerCharacterId: text, name: text, status: oneOf('owned', 'leased', 'unavailable') },
  businesses: { id: text, propertyId: text, ownerCharacterId: text, name: text, status: oneOf('active', 'paused', 'closed') },
  inventory: { id: text, ownerCharacterId: text, itemId: text, quantity: nonnegative },
  vehicles: { id: text, ownerCharacterId: text, modelId: text, status: oneOf('available', 'assigned', 'unavailable') },
  missions: { id: text, campaign: text, sceneId: text, stage: text, status: oneOf('available', 'active', 'completed', 'failed'), updatedAt: isTimestamp },
  relationships: { id: text, fromCharacterId: text, toCharacterId: text, value: integer },
  factions: { id: text, name: text, reputation: integer },
  worldClocks: { id: text, value: nonnegative, limit: nonnegative, updatedAt: isTimestamp },
  scheduledEvents: { id: text, clockId: text, dueAt: isTimestamp, status: oneOf('scheduled', 'fired', 'cancelled'), consequenceIds: texts }
});

export function validateDomainRecords(snapshot, errors) {
  const ids = key => new Set((Array.isArray(snapshot[key]) ? snapshot[key] : []).filter(isRecord).map(r => r.id));
  const characters = ids('characters');
  const properties = ids('properties');
  const clocks = ids('worldClocks');
  const consequences = new Set((Array.isArray(snapshot.consequences) ? snapshot.consequences : []).filter(isRecord).map(r => r.id || r.choiceId));
  const references = { ownerCharacterId: characters, fromCharacterId: characters, toCharacterId: characters, propertyId: properties, clockId: clocks };
  for (const [key, schema] of Object.entries(DOMAIN_SCHEMAS)) {
    if (!Array.isArray(snapshot[key])) continue;
    snapshot[key].forEach((record, index) => {
      const path = `${key}[${index}]`;
      if (!isRecord(record)) { errors.push(`${path} must be an object.`); return; }
      for (const [field, validate] of Object.entries(schema)) {
        if (!validate(record[field])) errors.push(`${path}.${field} is invalid.`);
      }
      for (const [field, targets] of Object.entries(references)) {
        if (field in schema && !targets.has(record[field])) errors.push(`${path}.${field} references a missing record.`);
      }
      if (key === 'worldClocks' && record.value > record.limit) errors.push(`${path}.value exceeds limit.`);
      if (key === 'scheduledEvents' && Array.isArray(record.consequenceIds) && record.consequenceIds.some(id => !consequences.has(id))) errors.push(`${path} references a missing consequence.`);
    });
  }
  if (!isRecord(snapshot.reputation) || Object.values(snapshot.reputation).some(value => !integer(value))) errors.push('Reputation axes, including politicalHeat, must be safe integers.');
  if (Array.isArray(snapshot.consequences)) {
    snapshot.consequences.forEach((record, index) => {
      // v1 mobile decisions are an explicitly supported compatibility shape.
      if (!isRecord(record)) { errors.push(`consequences[${index}] must be an object.`); return; }
      for (const field of ['choiceId', 'title', 'immediate', 'future']) if (!text(record[field])) errors.push(`consequences[${index}].${field} is invalid.`);
      if (!isTimestamp(record.at)) errors.push(`consequences[${index}].at is invalid.`);
      if ('id' in record && !text(record.id)) errors.push(`consequences[${index}].id is invalid.`);
      if ('parentIds' in record && (!texts(record.parentIds) || record.parentIds.some(id => !consequences.has(id) || id === (record.id || record.choiceId)))) errors.push(`consequences[${index}].parentIds is invalid.`);
    });
    // Parents must precede children, which also rules out cycles.
    const prior = new Set();
    for (const record of snapshot.consequences.filter(isRecord)) {
      if (Array.isArray(record.parentIds) && record.parentIds.some(id => !prior.has(id))) errors.push('Consequence parents must precede their children.');
      prior.add(record.id || record.choiceId);
    }
  }
}
