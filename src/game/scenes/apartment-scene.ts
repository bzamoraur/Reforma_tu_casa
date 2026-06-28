import Phaser from 'phaser';
import { sceneBridge } from '../systems/bridge';

interface RoomDef {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: number;
}

/**
 * Placeholder apartment backdrop. Rooms are coloured rectangles and the avatar
 * is a simple circle — deliberately cheap visuals (master prompt §12: get the
 * loop working before investing in art). The active room is highlighted as the
 * player advances through scenarios.
 */
const ROOMS: RoomDef[] = [
  { name: 'Recibidor', x: 90, y: 320, w: 150, h: 150, color: 0x2b3a55 },
  { name: 'Salón', x: 260, y: 300, w: 240, h: 180, color: 0x35506b },
  { name: 'Cocina', x: 520, y: 300, w: 170, h: 150, color: 0x3a5a4b },
  { name: 'Baño', x: 520, y: 130, w: 120, h: 140, color: 0x4a3a5a },
  { name: 'Dormitorio', x: 300, y: 110, w: 200, h: 160, color: 0x5a4a35 },
];

const DESIGN_WIDTH = 960;
const DESIGN_HEIGHT = 540;

export class ApartmentScene extends Phaser.Scene {
  private roomRects: Phaser.GameObjects.Rectangle[] = [];
  private avatar?: Phaser.GameObjects.Arc;
  private activeIndex = 0;

  constructor() {
    super('apartment');
  }

  create(): void {
    this.add
      .text(DESIGN_WIDTH / 2, 30, 'Reforma Quest Madrid', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#cbd5e1',
      })
      .setOrigin(0.5);

    this.add
      .text(DESIGN_WIDTH / 2, 60, 'MVP · contenido en borrador', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#64748b',
      })
      .setOrigin(0.5);

    this.roomRects = ROOMS.map((room) => {
      const rect = this.add
        .rectangle(room.x, room.y, room.w, room.h, room.color)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0x0e1726);
      this.add
        .text(room.x + room.w / 2, room.y + room.h / 2, room.name, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          color: '#e2e8f0',
        })
        .setOrigin(0.5);
      return rect;
    });

    this.avatar = this.add.circle(0, 0, 14, 0xf59e0b).setStrokeStyle(2, 0x1e293b);

    // Register with the UI bridge so the overlay can drive the active room.
    sceneBridge.setActiveRoom = (index: number) => this.highlightRoom(index);
    this.highlightRoom(0);
  }

  private highlightRoom(index: number): void {
    if (this.roomRects.length === 0) return;
    this.activeIndex =
      ((index % this.roomRects.length) + this.roomRects.length) % this.roomRects.length;
    this.roomRects.forEach((rect, i) => {
      rect.setFillStyle(ROOMS[i].color, i === this.activeIndex ? 1 : 0.55);
    });
    const room = ROOMS[this.activeIndex];
    this.avatar?.setPosition(room.x + room.w / 2, room.y + room.h - 24);
  }
}

export const apartmentSceneDesign = { width: DESIGN_WIDTH, height: DESIGN_HEIGHT };
