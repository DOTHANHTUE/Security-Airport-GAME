import type {
  ItemShapeId,
  LuggageCase,
  MaterialClass,
  PackedItem,
  XRayFilterMode,
} from '../types/game';

export interface BoxRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface StampEffect {
  text: string;
  color: string;
  timer: number;
  maxTimer: number;
}

interface PaletteColor {
  fill: string;
  stroke: string;
  core: string;
  alpha: number;
}

/**
 * Computes authentic Dual-Energy X-ray colors based on material class and active filter mode.
 * Organic = Amber/Orange, Inorganic = Emerald/Green, Metal = Cobalt/Deep Blue
 */
function getMaterialPalette(
  material: MaterialClass,
  filter: XRayFilterMode,
  isSecondary: boolean
): PaletteColor {
  const baseMap: Record<MaterialClass, { fill: string; stroke: string; core: string }> = {
    organic: {
      fill: 'rgba(249, 115, 22, 0.72)',
      stroke: '#ea580c',
      core: 'rgba(194, 65, 12, 0.85)',
    },
    inorganic: {
      fill: 'rgba(34, 197, 94, 0.68)',
      stroke: '#15803d',
      core: 'rgba(21, 128, 61, 0.88)',
    },
    metal: {
      fill: 'rgba(37, 99, 235, 0.76)',
      stroke: '#1e3a8a',
      core: 'rgba(15, 23, 42, 0.92)',
    },
    mixed: {
      fill: 'rgba(20, 184, 166, 0.7)',
      stroke: '#0f766e',
      core: 'rgba(30, 58, 138, 0.86)',
    },
  };

  const c = baseMap[material];
  let alpha = isSecondary ? 0.95 : 0.88;

  if (filter === 'ORGANIC') {
    if (material === 'organic') {
      alpha = 1;
      return {
        fill: 'rgba(234, 88, 12, 0.88)',
        stroke: '#9a3412',
        core: 'rgba(154, 52, 18, 0.95)',
        alpha,
      };
    }
    if (material === 'mixed') {
      alpha = 0.45;
    } else {
      alpha = 0.14;
    }
  } else if (filter === 'METAL') {
    if (material === 'metal') {
      alpha = 1;
      return {
        fill: 'rgba(29, 78, 216, 0.92)',
        stroke: '#0f172a',
        core: 'rgba(2, 6, 23, 0.98)',
        alpha,
      };
    }
    if (material === 'inorganic' || material === 'mixed') {
      alpha = 0.42;
    } else {
      alpha = 0.12;
    }
  } else if (filter === 'HIPEN') {
    // High-Penetration boosts dark core sharpness & cuts through organic clutter
    if (material === 'organic') {
      alpha = 0.35;
    } else if (material === 'metal') {
      return {
        fill: 'rgba(56, 189, 248, 0.78)',
        stroke: '#0284c7',
        core: 'rgba(15, 23, 42, 0.95)',
        alpha: 1,
      };
    } else {
      alpha = 0.85;
    }
  }

  return { ...c, alpha };
}

function drawShapeVector(
  ctx: CanvasRenderingContext2D,
  id: ItemShapeId,
  pal: PaletteColor,
  filter: XRayFilterMode,
  edgeOn: boolean,
  sideView: boolean
) {
  ctx.save();
  ctx.globalAlpha *= pal.alpha;
  ctx.fillStyle = pal.fill;
  ctx.strokeStyle = pal.stroke;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Simulate edge-on flattening when top-down, OR reveal full profile when in sideView!
  const effectiveFlat = edgeOn && !sideView;
  if (effectiveFlat) {
    ctx.scale(1, 0.22);
  } else if (sideView && !edgeOn) {
    ctx.scale(0.95, 0.76);
  }

  switch (id) {
    case 'knife_hunting': {
      // Handle (organic brown/orange) + steel crossguard + tapered Bowie blade
      ctx.beginPath();
      ctx.moveTo(-54, -8);
      ctx.lineTo(-16, -8);
      ctx.lineTo(-16, 8);
      ctx.lineTo(-54, 8);
      ctx.closePath();
      ctx.fillStyle = filter === 'METAL' ? 'rgba(100,116,139,0.35)' : 'rgba(234,88,12,0.85)';
      ctx.fill();
      ctx.stroke();

      // Crossguard
      ctx.fillStyle = pal.core;
      ctx.fillRect(-18, -16, 6, 32);

      // Blade
      ctx.beginPath();
      ctx.moveTo(-12, -11);
      ctx.lineTo(36, -11);
      ctx.quadraticCurveTo(50, -6, 56, 0);
      ctx.quadraticCurveTo(38, 12, -12, 11);
      ctx.closePath();
      ctx.fillStyle = pal.fill;
      ctx.fill();
      ctx.stroke();
      // Fuller groove & tang
      ctx.beginPath();
      ctx.moveTo(-48, 0);
      ctx.lineTo(32, 0);
      ctx.strokeStyle = pal.core;
      ctx.stroke();
      break;
    }

    case 'knife_utility': {
      // Utility cutter body + segmented razor blade sticking out
      ctx.fillStyle = filter === 'METAL' ? 'rgba(100,116,139,0.25)' : 'rgba(34,197,94,0.75)';
      ctx.beginPath();
      ctx.roundRect(-48, -12, 64, 24, 5);
      ctx.fill();
      ctx.stroke();

      // Metal blade
      ctx.fillStyle = pal.core;
      ctx.beginPath();
      ctx.moveTo(12, -8);
      ctx.lineTo(48, -8);
      ctx.lineTo(38, 8);
      ctx.lineTo(12, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Snap segments
      ctx.beginPath();
      for (let sx = 20; sx <= 38; sx += 6) {
        ctx.moveTo(sx, -7);
        ctx.lineTo(sx - 3, 7);
      }
      ctx.strokeStyle = '#93c5fd';
      ctx.stroke();
      break;
    }

    case 'scissors_large': {
      // Two crossed blades + finger loops
      ctx.strokeStyle = pal.stroke;
      ctx.fillStyle = pal.fill;
      for (const dir of [-1, 1]) {
        ctx.save();
        ctx.rotate(dir * 0.18);
        ctx.beginPath();
        ctx.moveTo(-12, -3);
        ctx.lineTo(48, -2);
        ctx.lineTo(52, 2);
        ctx.lineTo(-12, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Loop
        ctx.beginPath();
        ctx.ellipse(-28, dir * 8, 15, 9, 0, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      }
      // Pivot screw
      ctx.beginPath();
      ctx.arc(-4, 0, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = pal.core;
      ctx.fill();
      break;
    }

    case 'handgun': {
      // Slide + barrel + frame + trigger guard + grip + internal magazine spring
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      // Top slide
      ctx.moveTo(-46, -28);
      ctx.lineTo(54, -28);
      ctx.lineTo(54, -10);
      ctx.lineTo(8, -10);
      // Trigger guard
      ctx.lineTo(8, 12);
      ctx.lineTo(-12, 12);
      // Grip
      ctx.lineTo(-22, 38);
      ctx.lineTo(-48, 36);
      ctx.lineTo(-36, -6);
      ctx.lineTo(-46, -12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Trigger
      ctx.beginPath();
      ctx.moveTo(-2, -9);
      ctx.quadraticCurveTo(-5, 4, 2, 7);
      ctx.strokeStyle = pal.core;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Magazine & spring inside grip
      ctx.beginPath();
      ctx.moveTo(-36, 0);
      ctx.lineTo(-26, 4);
      ctx.lineTo(-39, 10);
      ctx.lineTo(-28, 16);
      ctx.lineTo(-41, 22);
      ctx.lineTo(-30, 28);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      break;
    }

    case 'ammo_clip': {
      ctx.fillStyle = pal.fill;
      ctx.fillRect(-32, -20, 64, 40);
      ctx.strokeRect(-32, -20, 64, 40);
      // Individual cartridges
      for (let i = -24; i <= 20; i += 11) {
        ctx.fillStyle = pal.core;
        ctx.fillRect(i, -15, 7, 22);
        ctx.beginPath();
        ctx.moveTo(i, -15);
        ctx.lineTo(i + 3.5, -24);
        ctx.lineTo(i + 7, -15);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'taser': {
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.roundRect(-44, -14, 78, 28, 6);
      ctx.fill();
      ctx.stroke();
      // High voltage prongs
      ctx.fillStyle = pal.core;
      ctx.fillRect(34, -10, 16, 4);
      ctx.fillRect(34, 6, 16, 4);
      // Internal capacitor + battery
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(-34, -8, 26, 16);
      ctx.beginPath();
      ctx.arc(8, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'c4_ied': {
      // Dense organic block
      ctx.fillStyle = filter === 'METAL' ? 'rgba(100,116,139,0.2)' : 'rgba(234, 88, 12, 0.9)';
      ctx.beginPath();
      ctx.roundRect(-48, -24, 58, 48, 4);
      ctx.fill();
      ctx.stroke();

      // PCB timer board
      ctx.fillStyle = filter === 'ORGANIC' ? 'rgba(100,116,139,0.2)' : 'rgba(22, 163, 74, 0.9)';
      ctx.fillRect(14, -22, 34, 44);
      ctx.strokeRect(14, -22, 34, 44);

      // Coiled detonator wires
      ctx.beginPath();
      ctx.moveTo(-12, -8);
      ctx.bezierCurveTo(2, -32, 6, 18, 22, -10);
      ctx.moveTo(-12, 10);
      ctx.bezierCurveTo(4, 30, 8, -14, 22, 10);
      ctx.strokeStyle = filter === 'ORGANIC' ? 'rgba(51,65,85,0.4)' : '#1d4ed8';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Detonator cap embedded in explosive
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-16, -6, 14, 12);
      break;
    }

    case 'fireworks': {
      // Bundle of 4 cylindrical tubes with organic powder cores + fuses
      for (let i = -18; i <= 18; i += 12) {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
        ctx.fillRect(-34, i - 5, 64, 10);
        ctx.strokeRect(-34, i - 5, 64, 10);
        // Fuse
        ctx.beginPath();
        ctx.moveTo(30, i);
        ctx.quadraticCurveTo(40, i - 6, 46, i + 2);
        ctx.stroke();
      }
      // Binding strap
      ctx.fillStyle = pal.core;
      ctx.fillRect(-6, -24, 8, 48);
      break;
    }

    case 'gas_canister': {
      // Pressurized metallic cylinder with liquid fill line & nozzle
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.roundRect(-22, -34, 44, 78, 12);
      ctx.fill();
      ctx.stroke();
      // Liquid level inside (organic fuel)
      ctx.fillStyle = filter === 'METAL' ? 'rgba(30,64,175,0.4)' : 'rgba(249, 115, 22, 0.65)';
      ctx.fillRect(-18, -4, 36, 42);
      // Valve stem
      ctx.fillStyle = pal.core;
      ctx.fillRect(-7, -46, 14, 12);
      ctx.fillRect(-3, -52, 6, 6);
      break;
    }

    case 'torch_lighter': {
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.roundRect(-18, -22, 36, 56, 6);
      ctx.fill();
      ctx.stroke();
      // Liquid butane tank inside
      ctx.fillStyle = 'rgba(249, 115, 22, 0.72)';
      ctx.fillRect(-12, -4, 24, 32);
      // Metal nozzle + piezo
      ctx.fillStyle = pal.core;
      ctx.fillRect(-8, -36, 16, 14);
      break;
    }

    case 'pepper_spray': {
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.roundRect(-16, -28, 32, 68, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(234, 88, 12, 0.7)';
      ctx.fillRect(-12, -10, 24, 44);
      // Actuator head
      ctx.fillStyle = pal.core;
      ctx.beginPath();
      ctx.moveTo(-14, -28);
      ctx.lineTo(-14, -42);
      ctx.lineTo(18, -38);
      ctx.lineTo(14, -28);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'acid_bottle': {
      // Large >100ml bottle with high-density liquid
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.moveTo(-24, -18);
      ctx.lineTo(-10, -44);
      ctx.lineTo(10, -44);
      ctx.lineTo(24, -18);
      ctx.lineTo(24, 44);
      ctx.lineTo(-24, 44);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Dense liquid inside
      ctx.fillStyle = pal.core;
      ctx.fillRect(-20, -10, 40, 50);
      // Cap
      ctx.fillRect(-11, -52, 22, 8);
      break;
    }

    case 'over_battery': {
      // Heavy multi-cell Li-Ion pack (>160Wh)
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.roundRect(-48, -24, 96, 48, 5);
      ctx.fill();
      ctx.stroke();
      // 8 cylindrical/prismatic heavy cells
      ctx.fillStyle = pal.core;
      for (let cx = -40; cx <= 24; cx += 18) {
        ctx.fillRect(cx, -18, 14, 36);
      }
      // Thick copper busbars
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-42, -20);
      ctx.lineTo(42, -20);
      ctx.moveTo(-42, 20);
      ctx.lineTo(42, 20);
      ctx.stroke();
      break;
    }

    case 'ceramic_knife': {
      // Inorganic green blade + organic handle (no blue metal!)
      ctx.fillStyle = filter === 'METAL' ? 'rgba(148,163,184,0.18)' : 'rgba(249, 115, 22, 0.75)';
      ctx.fillRect(-50, -7, 36, 14);
      ctx.strokeRect(-50, -7, 36, 14);
      // Ceramic blade (inorganic green)
      ctx.fillStyle = filter === 'METAL' ? 'rgba(148,163,184,0.22)' : 'rgba(34, 197, 94, 0.85)';
      ctx.beginPath();
      ctx.moveTo(-14, -9);
      ctx.lineTo(44, -9);
      ctx.lineTo(54, 0);
      ctx.quadraticCurveTo(32, 11, -14, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'disassembled_gun': {
      // Separated rifled barrel + recoil spring + slide frame
      ctx.fillStyle = pal.core;
      ctx.fillRect(-48, -16, 92, 10);
      ctx.strokeRect(-48, -16, 92, 10);
      // Spring rod below
      ctx.beginPath();
      for (let sx = -40; sx <= 30; sx += 8) {
        ctx.moveTo(sx, 2);
        ctx.lineTo(sx + 4, 12);
        ctx.lineTo(sx + 8, 2);
      }
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Firing pin block
      ctx.fillRect(10, 4, 28, 12);
      break;
    }

    // === SAFE ITEMS ===
    case 'clothes_folded': {
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.roundRect(-60, -40, 120, 80, 16);
      ctx.fill();
      ctx.stroke();
      // Soft folded fabric creases
      ctx.beginPath();
      ctx.moveTo(-48, -14);
      ctx.quadraticCurveTo(0, -6, 48, -16);
      ctx.moveTo(-44, 14);
      ctx.quadraticCurveTo(0, 22, 46, 12);
      ctx.stroke();
      break;
    }

    case 'sneakers': {
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.moveTo(-46, 18);
      ctx.lineTo(46, 18);
      ctx.quadraticCurveTo(50, 4, 24, 0);
      ctx.lineTo(-10, -24);
      ctx.lineTo(-42, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Rubber sole tread
      ctx.fillStyle = pal.core;
      ctx.fillRect(-46, 18, 92, 8);
      // Tiny lace eyelets
      for (let ex = -14; ex <= 10; ex += 8) {
        ctx.beginPath();
        ctx.arc(ex, -8 + (ex + 14) * 0.2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'laptop': {
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.roundRect(-62, -44, 124, 88, 6);
      ctx.fill();
      ctx.stroke();
      // Internal battery cells (safe, medium) + motherboard PCB + fan
      ctx.fillStyle = 'rgba(21, 128, 61, 0.65)';
      ctx.fillRect(-52, 12, 68, 22);
      ctx.strokeRect(-52, -34, 104, 40);
      // Cooling fan circle
      ctx.beginPath();
      ctx.arc(30, -14, 14, 0, Math.PI * 2);
      ctx.stroke();
      // CPU square
      ctx.fillStyle = pal.core;
      ctx.fillRect(-16, -22, 18, 18);
      break;
    }

    case 'camera_dslr': {
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.roundRect(-40, -24, 80, 52, 6);
      ctx.fill();
      ctx.stroke();
      // Pentaprism top
      ctx.fillRect(-18, -36, 36, 12);
      // Concentric glass lens rings
      for (const r of [20, 14, 7]) {
        ctx.beginPath();
        ctx.arc(2, 2, r, 0, Math.PI * 2);
        ctx.strokeStyle = pal.core;
        ctx.stroke();
      }
      break;
    }

    case 'powerbank_safe': {
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.roundRect(-34, -18, 68, 36, 6);
      ctx.fill();
      ctx.stroke();
      // 2 clean standard cells
      ctx.fillStyle = pal.core;
      ctx.fillRect(-26, -12, 22, 24);
      ctx.fillRect(0, -12, 22, 24);
      break;
    }

    case 'headphones': {
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 6, 34, Math.PI, 0);
      ctx.stroke();
      // Ear cups + tiny copper driver coils
      ctx.lineWidth = 2;
      for (const side of [-1, 1]) {
        ctx.fillStyle = pal.fill;
        ctx.beginPath();
        ctx.ellipse(side * 34, 14, 10, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(side * 32, 14, 5, 0, Math.PI * 2);
        ctx.fillStyle = pal.core;
        ctx.fill();
      }
      break;
    }

    case 'book': {
      ctx.fillStyle = pal.fill;
      ctx.fillRect(-44, -34, 88, 68);
      ctx.strokeRect(-44, -34, 88, 68);
      // Spine & page striations
      ctx.beginPath();
      ctx.moveTo(-34, -34);
      ctx.lineTo(-34, 34);
      ctx.stroke();
      break;
    }

    case 'umbrella': {
      // Folded shaft + symmetrical thin metal ribs
      ctx.fillStyle = pal.fill;
      ctx.fillRect(-54, -4, 100, 8);
      ctx.strokeRect(-54, -4, 100, 8);
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(42, i * 4);
        ctx.stroke();
      }
      // Curved handle
      ctx.beginPath();
      ctx.arc(-52, 6, 10, Math.PI * 0.5, Math.PI * 1.5);
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
    }

    case 'keys': {
      ctx.strokeStyle = pal.core;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-14, 0, 9, 0, Math.PI * 2);
      ctx.stroke();
      for (const ang of [-0.35, 0.1, 0.55]) {
        ctx.save();
        ctx.translate(-6, 0);
        ctx.rotate(ang);
        ctx.fillStyle = pal.fill;
        ctx.fillRect(0, -2.5, 28, 5);
        ctx.fillRect(18, 2.5, 4, 4);
        ctx.fillRect(24, 2.5, 3, 5);
        ctx.restore();
      }
      break;
    }

    case 'glasses': {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.32)';
      ctx.beginPath();
      ctx.roundRect(-38, -16, 76, 32, 12);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = pal.core;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-15, 0, 12, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(15, 0, 12, 8, 0, 0, Math.PI * 2);
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.stroke();
      break;
    }

    case 'electric_toothbrush': {
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.roundRect(-44, -8, 60, 16, 6);
      ctx.fill();
      ctx.stroke();
      // Neck + bristles
      ctx.fillRect(16, -3, 28, 6);
      ctx.fillRect(36, -9, 10, 6);
      // Tiny motor coil
      ctx.fillStyle = pal.core;
      ctx.fillRect(-30, -5, 18, 10);
      break;
    }

    case 'hairdryer': {
      // Gun-like outer silhouette BUT hollow barrel with heating coil & rear turbine fan!
      ctx.fillStyle = filter === 'METAL' ? 'rgba(100,116,139,0.2)' : 'rgba(249, 115, 22, 0.52)';
      ctx.beginPath();
      ctx.moveTo(-36, -24);
      ctx.lineTo(44, -20);
      ctx.lineTo(44, 4);
      ctx.lineTo(4, 6);
      ctx.lineTo(-4, 38);
      ctx.lineTo(-24, 38);
      ctx.lineTo(-16, 4);
      ctx.lineTo(-36, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Clearly visible heating coil zigzag inside nozzle + fan blades at back
      ctx.strokeStyle = pal.core;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let hx = 4; hx <= 36; hx += 6) {
        ctx.moveTo(hx, -15);
        ctx.lineTo(hx + 3, -1);
      }
      ctx.stroke();
      // Fan rotor
      ctx.beginPath();
      ctx.arc(-20, -10, 9, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'mini_toiletries': {
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.roundRect(-16, -22, 32, 52, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(-7, -32, 14, 10);
      break;
    }

    case 'thermos_empty': {
      // Hollow double-wall steel cylinder (light center, dark double walls)
      ctx.strokeStyle = pal.core;
      ctx.lineWidth = 4;
      ctx.strokeRect(-18, -38, 36, 80);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.15)';
      ctx.fillRect(-14, -34, 28, 72);
      ctx.fillStyle = pal.core;
      ctx.fillRect(-12, -46, 24, 8);
      break;
    }

    case 'tripod_compact': {
      ctx.fillStyle = pal.fill;
      for (const offset of [-9, 0, 9]) {
        ctx.fillRect(-48, offset - 3, 92, 6);
        ctx.strokeRect(-48, offset - 3, 92, 6);
      }
      ctx.fillStyle = pal.core;
      ctx.fillRect(40, -11, 14, 22);
      break;
    }
  }

  ctx.restore();
}

export function getBagInnerRect(box: BoxRect): BoxRect {
  const pad = Math.min(box.w, box.h) * 0.08;
  return {
    x: box.x + pad,
    y: box.y + pad,
    w: box.w - pad * 2,
    h: box.h - pad * 2,
  };
}

export function drawLuggageXRay(
  ctx: CanvasRenderingContext2D,
  bag: LuggageCase,
  box: BoxRect,
  options: {
    filter: XRayFilterMode;
    isSecondary: boolean;
    sideView: boolean;
    peeledTopLayer: boolean;
    hoveredItemId: string | null;
    scanTargetId: string | null;
    scanProgress: number;
    time: number;
  }
) {
  ctx.save();

  // Suitcase outer shell (X-ray translucent casing)
  const r = bag.style === 'duffel' ? 28 : bag.style === 'backpack' ? 22 : 12;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, r);

  if (options.filter === 'HIPEN') {
    ctx.fillStyle = 'rgba(241, 245, 249, 0.96)';
  } else {
    ctx.fillStyle = 'rgba(248, 250, 252, 0.94)';
  }
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = bag.style === 'hardcase' ? '#475569' : '#64748b';
  ctx.stroke();

  // Wheels & telescopic handle bars in X-ray
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
  ctx.lineWidth = 3;
  if (bag.style === 'hardcase' || bag.style === 'briefcase') {
    // Handle tubes
    ctx.beginPath();
    ctx.moveTo(box.x + 14, box.y + box.h * 0.34);
    ctx.lineTo(box.x + box.w * 0.72, box.y + box.h * 0.34);
    ctx.moveTo(box.x + 14, box.y + box.h * 0.66);
    ctx.lineTo(box.x + box.w * 0.72, box.y + box.h * 0.66);
    ctx.stroke();
    // Side wheels
    ctx.fillStyle = '#334155';
    ctx.fillRect(box.x - 6, box.y + 24, 6, 20);
    ctx.fillRect(box.x - 6, box.y + box.h - 44, 6, 20);
  }

  // Zipper / Frame seam
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(box.x + 10, box.y + 10, box.w - 20, box.h - 20);
  ctx.setLineDash([]);

  const inner = getBagInnerRect(box);
  const scaleFactor = box.w / bag.width;

  // Render items
  for (const item of bag.items) {
    // If top layer is peeled off in Secondary Inspection, fade top clutter items!
    const isPeeledClutter = options.peeledTopLayer && item.layer === 'top';
    const cx = inner.x + inner.w * (0.5 + item.relX);
    const cy =
      options.sideView
        ? inner.y + inner.h * (0.5 + item.relY * 0.45)
        : inner.y + inner.h * (0.5 + item.relY);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(options.sideView ? item.rotation * 0.25 : item.rotation);
    ctx.scale(item.scale * scaleFactor, item.scale * scaleFactor);

    if (isPeeledClutter) {
      ctx.globalAlpha *= 0.14;
    }

    // If bag has foil shielding and not peeled & not HIPEN, obscure items partially
    const pal = getMaterialPalette(item.material, options.filter, options.isSecondary);
    if (bag.hasFoilShield && !options.peeledTopLayer && options.filter !== 'HIPEN') {
      ctx.globalAlpha *= 0.42;
    }

    drawShapeVector(ctx, item.templateId, pal, options.filter, item.edgeOn, options.sideView);

    // Highlight hovered or tagged item
    if (options.hoveredItemId === item.uid || item.taggedAsThreat) {
      ctx.strokeStyle = item.taggedAsThreat ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(-54, -38, 108, 76);
      ctx.setLineDash([]);
    }

    // Active laser density scan line
    if (options.scanTargetId === item.uid && options.scanProgress > 0 && options.scanProgress < 1) {
      const sy = -36 + options.scanProgress * 72;
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-56, sy);
      ctx.lineTo(56, sy);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Foil Shield overlay if active & not peeled
  if (bag.hasFoilShield && !options.peeledTopLayer) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(inner.x + 14, inner.y + 12, inner.w - 28, inner.h - 24, 10);
    if (options.filter === 'HIPEN') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.55)';
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.58)';
      ctx.strokeStyle = '#1e3a8a';
    }
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    // Foil crinkle diagonal lines
    ctx.strokeStyle =
      options.filter === 'HIPEN' ? 'rgba(56,189,248,0.22)' : 'rgba(30, 58, 138, 0.45)';
    ctx.lineWidth = 1.5;
    for (let fx = inner.x + 24; fx < inner.x + inner.w - 24; fx += 24) {
      ctx.beginPath();
      ctx.moveTo(fx, inner.y + 18);
      ctx.lineTo(fx + 14, inner.y + inner.h - 18);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Bag Tag Code watermark inside corner of X-ray screen
  ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillText(bag.tagCode, box.x + 14, box.y + box.h - 12);

  ctx.restore();
}

export function findHoveredItem(
  bag: LuggageCase,
  canvasX: number,
  canvasY: number,
  box: BoxRect,
  sideView: boolean,
  peeledTopLayer: boolean
): PackedItem | null {
  const inner = getBagInnerRect(box);
  const scaleFactor = box.w / bag.width;

  // Search top-most clickable items first (if peeled, prioritize bottom layer!)
  const ordered = [...bag.items].reverse().sort((a, b) => {
    if (!peeledTopLayer) return 0;
    if (a.layer === b.layer) return 0;
    return a.layer === 'bottom' ? -1 : 1;
  });

  for (const item of ordered) {
    if (peeledTopLayer && item.layer === 'top') continue;
    const cx = inner.x + inner.w * (0.5 + item.relX);
    const cy = sideView
      ? inner.y + inner.h * (0.5 + item.relY * 0.45)
      : inner.y + inner.h * (0.5 + item.relY);

    const dx = canvasX - cx;
    const dy = canvasY - cy;
    const hitRadius = 46 * item.scale * scaleFactor;
    if (dx * dx + dy * dy <= hitRadius * hitRadius) {
      return item;
    }
  }
  return null;
}

export function drawAirportConveyorStage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: {
    beltOffset: number;
    bag: LuggageCase | null;
    bagX: number;
    bagTargetX: number;
    bagYOffset: number;
    filter: XRayFilterMode;
    isSecondary: boolean;
    sideView: boolean;
    peeledTopLayer: boolean;
    hoveredItemId: string | null;
    scanTargetId: string | null;
    scanProgress: number;
    mouseX: number;
    mouseY: number;
    loupeActive: boolean;
    stamp: StampEffect | null;
    particles: Particle[];
    flashAlpha: number;
    flashColor: string;
    shakeX: number;
    shakeY: number;
    time: number;
  }
) {
  ctx.save();
  ctx.translate(state.shakeX, state.shakeY);

  // 1. Airport Screening Hall Background (Steel/Slate workstation backdrop)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0b1220');
  bgGrad.addColorStop(0.65, '#111a2e');
  bgGrad.addColorStop(1, '#090e1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle architectural grid lines in background
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < width; gx += 64) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }

  // 2. Conveyor Belt Track (spans horizontally across middle-bottom)
  const beltY = height * 0.56;
  const beltH = Math.min(180, height * 0.34);

  // Conveyor frame rails
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, beltY - beltH / 2 - 14, width, beltH + 28);
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, beltY - beltH / 2 - 14, width, 6);
  ctx.fillRect(0, beltY + beltH / 2 + 8, width, 6);

  // Rubber conveyor surface
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, beltY - beltH / 2, width, beltH);

  // Animated conveyor slats
  const slatSpacing = 44;
  const offsetMod = ((state.beltOffset % slatSpacing) + slatSpacing) % slatSpacing;
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
  ctx.lineWidth = 2;
  for (let sx = -slatSpacing + offsetMod; sx < width + slatSpacing; sx += slatSpacing) {
    ctx.beginPath();
    ctx.moveTo(sx, beltY - beltH / 2 + 4);
    ctx.lineTo(sx, beltY + beltH / 2 - 4);
    ctx.stroke();
  }

  // 3. Central X-Ray Inspection Chamber (Monitor Frame)
  const chamberW = Math.min(620, width * 0.62);
  const chamberH = Math.min(390, height * 0.72);
  const chamberX = (width - chamberW) / 2;
  const chamberY = (height - chamberH) / 2 - 6;

  // Outer industrial housing
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(chamberX - 22, chamberY - 26, chamberW + 44, chamberH + 52, 16);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hazard yellow-black warning chevrons on tunnel sides
  for (const sideX of [chamberX - 18, chamberX + chamberW + 6]) {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(sideX, chamberY + 18, 12, chamberH - 36);
    ctx.fillStyle = '#0f172a';
    for (let cy = chamberY + 22; cy < chamberY + chamberH - 28; cy += 22) {
      ctx.fillRect(sideX, cy, 12, 10);
    }
  }

  // X-Ray Active Screen Backing (crisp light-table radiography backdrop)
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(chamberX, chamberY, chamberW, chamberH, 10);
  ctx.clip();

  const screenGrad = ctx.createRadialGradient(
    width / 2,
    chamberY + chamberH / 2,
    40,
    width / 2,
    chamberY + chamberH / 2,
    chamberW * 0.7
  );
  if (state.filter === 'HIPEN') {
    screenGrad.addColorStop(0, '#0f172a');
    screenGrad.addColorStop(1, '#020617');
  } else {
    screenGrad.addColorStop(0, '#f8fafc');
    screenGrad.addColorStop(1, '#e2e8f0');
  }
  ctx.fillStyle = screenGrad;
  ctx.fillRect(chamberX, chamberY, chamberW, chamberH);

  // Subtle calibration grid inside X-Ray monitor
  ctx.strokeStyle =
    state.filter === 'HIPEN' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.06)';
  ctx.lineWidth = 1;
  for (let gx = chamberX + 40; gx < chamberX + chamberW; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, chamberY);
    ctx.lineTo(gx, chamberY + chamberH);
    ctx.stroke();
  }
  for (let gy = chamberY + 40; gy < chamberY + chamberH; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(chamberX, gy);
    ctx.lineTo(chamberX + chamberW, gy);
    ctx.stroke();
  }

  // 4. Render Active Suitcase inside X-Ray Chamber
  if (state.bag) {
    const zoomScale = state.isSecondary ? 1.24 : 1.0;
    const drawW = state.bag.width * zoomScale;
    const drawH = state.bag.height * zoomScale;
    const box: BoxRect = {
      x: state.bagX - drawW / 2,
      y: chamberY + chamberH / 2 - drawH / 2 + state.bagYOffset,
      w: drawW,
      h: drawH,
    };

    drawLuggageXRay(ctx, state.bag, box, {
      filter: state.filter,
      isSecondary: state.isSecondary,
      sideView: state.sideView,
      peeledTopLayer: state.peeledTopLayer,
      hoveredItemId: state.hoveredItemId,
      scanTargetId: state.scanTargetId,
      scanProgress: state.scanProgress,
      time: state.time,
    });

    // Optional interactive 1.55x Precision Magnifier Loupe
    if (
      state.loupeActive &&
      state.mouseX >= chamberX &&
      state.mouseX <= chamberX + chamberW &&
      state.mouseY >= chamberY &&
      state.mouseY <= chamberY + chamberH
    ) {
      const loupeR = 66;
      ctx.save();
      ctx.beginPath();
      ctx.arc(state.mouseX, state.mouseY, loupeR, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = state.filter === 'HIPEN' ? '#020617' : '#ffffff';
      ctx.fillRect(state.mouseX - loupeR, state.mouseY - loupeR, loupeR * 2, loupeR * 2);

      // Zoom around cursor
      ctx.translate(state.mouseX, state.mouseY);
      ctx.scale(1.55, 1.55);
      ctx.translate(-state.mouseX, -state.mouseY);
      drawLuggageXRay(ctx, state.bag, box, {
        filter: state.filter,
        isSecondary: true,
        sideView: state.sideView,
        peeledTopLayer: state.peeledTopLayer,
        hoveredItemId: state.hoveredItemId,
        scanTargetId: state.scanTargetId,
        scanProgress: state.scanProgress,
        time: state.time,
      });
      ctx.restore();

      // Loupe bezel ring
      ctx.beginPath();
      ctx.arc(state.mouseX, state.mouseY, loupeR, 0, Math.PI * 2);
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  // Sweeping vertical X-ray scan beam when luggage is active
  if (state.bag) {
    const beamX = chamberX + ((state.time * 160) % chamberW);
    const beamGrad = ctx.createLinearGradient(beamX - 18, 0, beamX + 18, 0);
    beamGrad.addColorStop(0, 'rgba(14, 165, 233, 0)');
    beamGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.14)');
    beamGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(beamX - 18, chamberY, 36, chamberH);
  }

  // Secondary Inspection Bench Rim Banner inside chamber
  if (state.isSecondary) {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.92)';
    ctx.fillRect(chamberX, chamberY, chamberW, 28);
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'BÀN KIỂM TRA CHUYÊN SÂU · Bấm trực tiếp vào vật phẩm để quét phổ mật độ',
      chamberX + 14,
      chamberY + 18
    );
  }

  // Stamp Overlay (CHO ĐI / TẠM GIỮ / VI PHẠM)
  if (state.stamp && state.stamp.timer > 0) {
    const t = state.stamp.timer / state.stamp.maxTimer;
    ctx.save();
    ctx.translate(width / 2, chamberY + chamberH / 2);
    ctx.rotate(-0.14);
    ctx.scale(1 + (1 - t) * 0.12, 1 + (1 - t) * 0.12);
    ctx.globalAlpha = Math.min(1, t * 2.2);
    ctx.strokeStyle = state.stamp.color;
    ctx.lineWidth = 5;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(-145, -34, 290, 68, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = state.stamp.color;
    ctx.font = '800 26px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.stamp.text, 0, 2);
    ctx.restore();
  }

  ctx.restore(); // end clip

  // Lead curtain strips on left entry & right exit of chamber
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  for (let i = 0; i < 6; i++) {
    const stripH = (chamberH - 12) / 6;
    ctx.fillRect(chamberX - 6, chamberY + 6 + i * stripH, 8, stripH - 3);
    ctx.fillRect(chamberX + chamberW - 2, chamberY + 6 + i * stripH, 8, stripH - 3);
  }

  // Chamber top label plate
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 11px "JetBrains Mono", monospace';
  const filterLabelMap: Record<XRayFilterMode, string> = {
    MULTI: 'CHẾ ĐỘ: ĐA NĂNG LƯỢNG (MÀU KÉP)',
    ORGANIC: 'CHẾ ĐỘ: LỌC HỮU CƠ (ORG)',
    METAL: 'CHẾ ĐỘ: LỌC KIM LOẠI (MET)',
    HIPEN: 'CHẾ ĐỘ: XUYÊN THẤU CAO (HI-PEN)',
  };
  ctx.fillText(filterLabelMap[state.filter], chamberX + 4, chamberY - 8);
  if (state.sideView) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('GÓC CHIẾU NGHIÊNG (SIDE VIEW)', chamberX + chamberW - 210, chamberY - 8);
  }

  // 5. Particles
  for (const p of state.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 6. Hit Flash Overlay
  if (state.flashAlpha > 0.01) {
    ctx.fillStyle = state.flashColor;
    ctx.globalAlpha = state.flashAlpha;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}
