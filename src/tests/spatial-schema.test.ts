import { describe, expect, it } from 'vitest';
import { housePackSchema, playerRoleSchema } from '../domain/spatial-schema';
import salon from '../content/rooms/salon.json';

describe('spatial schema', () => {
  it('validates the salón house pack', () => {
    expect(housePackSchema.safeParse(salon).success).toBe(true);
  });

  it('has NO execution playerRole (dangerous DIY is unrepresentable)', () => {
    expect(playerRoleSchema.safeParse('execute_installation').success).toBe(false);
    expect(playerRoleSchema.safeParse('wire_it_yourself').success).toBe(false);
    expect(playerRoleSchema.safeParse('choose_design').success).toBe(true);
    expect(playerRoleSchema.safeParse('supervise').success).toBe(true);
  });

  it('is strict: rejects unknown keys', () => {
    const bad = JSON.parse(JSON.stringify(salon));
    bad.rooms[0].surprise = true;
    expect(housePackSchema.safeParse(bad).success).toBe(false);
  });

  it('requires both before and after art for a room', () => {
    const bad = JSON.parse(JSON.stringify(salon));
    delete bad.rooms[0].art.after;
    expect(housePackSchema.safeParse(bad).success).toBe(false);
  });

  it('requires a hotspot position within the room art (0..1)', () => {
    const bad = JSON.parse(JSON.stringify(salon));
    bad.rooms[0].hotspots[0].x = 1.5;
    expect(housePackSchema.safeParse(bad).success).toBe(false);
  });
});
