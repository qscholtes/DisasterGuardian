import {
  BACKPACK_CAPACITY,
  challengeReducer,
  formatTime,
  getBadge,
  getScore,
  initialState,
} from '../Preparedness/EmergencyKit/EmergencyKitChallenge.logic';

describe('emergency-kit challenge logic', () => {
  test('scores essential items positively and non-essential items negatively', () => {
    expect(getScore([{ essential: true }], 30)).toBe(80);
    expect(getScore([{ essential: false }], 30)).toBe(5);
    expect(getScore([{ essential: false }], 0)).toBe(0);
  });

  test('maps scores to the displayed badge tiers', () => {
    expect(getBadge(400)[0]).toBe('Kit Expert');
    expect(getBadge(250)[0]).toBe('Kit Builder');
    expect(getBadge(249)[0]).toBe('Keep Practising');
  });

  test('formats the countdown consistently', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(125)).toBe('02:05');
  });

  test('packs, removes, submits, and caps items through the reducer', () => {
    const item = { id: 'water', essential: true };
    const started = challengeReducer(initialState, { type: 'START' });
    const withItem = { ...started, availableItems: [item] };
    const packed = challengeReducer(withItem, { type: 'PACK_ITEM', id: item.id });
    expect(packed.packedItems).toEqual([item]);
    expect(packed.availableItems).toEqual([]);

    const removed = challengeReducer(packed, { type: 'REMOVE_ITEM', id: item.id });
    expect(removed.packedItems).toEqual([]);
    expect(removed.availableItems).toEqual([item]);

    const submitted = challengeReducer(packed, { type: 'SUBMIT' });
    expect(submitted.phase).toBe('results');
    expect(submitted.selectedItems).toEqual([item]);

    const fullState = {
      ...started,
      packedItems: Array.from({ length: BACKPACK_CAPACITY }, (_, index) => ({ id: String(index) })),
      availableItems: [item],
    };
    expect(challengeReducer(fullState, { type: 'PACK_ITEM', id: item.id })).toBe(fullState);
  });
});
