
export enum Direction {
  LEFT = -1,
  RIGHT = 1,
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Entity extends Rect {
  id: string;
  vx: number;
  vy: number;
  color: string;
  emoji: string;
  direction: Direction;
  isDead: boolean;
}

export type WeaponType = 'Sword' | 'Spear' | 'Bow' | 'Gun' | 'Greatsword' | 'Polearm' | 'Crossbow' | 'Cannon' | 'Staff';
export type ClassType = 'Warrior' | 'Lancer' | 'Archer' | 'Gunner' | 'Mage';

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  shield: number; 
  level: number;
  exp: number;
  maxExp: number;
  attack: number;
  name: string;
  isAttacking: boolean;
  isDownAttacking: boolean; // New: Downward attack state
  attackCooldown: number;
  maxAttackCooldown: number;
  classType: ClassType;
  isAdvanced: boolean; 
  currentWeapon: WeaponType;
  unlockedWeapons: WeaponType[];
  weaponRotation: number;
  invincibilityTimer: number; 
  gold: number; 
  hpPotions: number; 
  mpPotions: number; 
  maxStageReached: number;
  sp: number; 
  skills: Record<string, number>; 
  skillSlots: Record<string, string>; 
  cooldowns: Record<string, number>; 
  jumps: number; 
  maxJumps: number;
  buffs: Record<string, number>; 
}

export interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  damage: number;
  expValue: number;
  type: string; 
  patrolStart: number;
  patrolEnd: number;
  attackTimer: number;
  isBoss: boolean; 
  freezeTimer: number; 
  stunTimer: number;   
  isRanged: boolean; 
  deathTimer?: number; // Added for fade out animation
}

export interface Projectile extends Rect {
  id: string;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  emoji: string;
  life: number;
  maxLife?: number;
  isDead: boolean;
  isMagic: boolean;
  skillId?: string; 
  trail?: {x: number, y: number, alpha: number}[];
  rotation?: number;
  rotationSpeed?: number;
  isTrap?: boolean; 
  isSummon?: boolean; 
  summonTimer?: number;
  isEnemy?: boolean; 
  piercing?: boolean; 
  explosive?: boolean;
  weaponType?: WeaponType; 
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  text: string; // Used for Emoji or Text
  color: string;
  life: number;
  maxLife: number;
  vx: number; 
  vy: number;
  scale?: number; 
  // Visual Effect Props
  shape?: 'text' | 'circle' | 'slash' | 'ring' | 'lightning' | 'pillar';
  width?: number;
  height?: number;
  rotation?: number;
  targetX?: number; // For lightning/beam
  targetY?: number;
}

export interface Item extends Rect {
  id: string;
  type: 'Gold' | 'HpPotion' | 'MpPotion' | 'Weapon' | 'QuestItem'; 
  weaponType?: WeaponType;
  questItemName?: string; 
  value: number;
  vx: number;
  vy: number;
  emoji: string;
  life: number; 
}

export interface Lightning {
  id: string;
  points: {x: number, y: number}[];
  life: number;
  maxLife: number;
  color: string;
  width: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  particles: Particle[];
  projectiles: Projectile[];
  platforms: Rect[];
  items: Item[]; 
  lightnings: Lightning[]; 
  cameraX: number;
  worldWidth: number;
  stageLevel: number;
  shakeTimer: number; 
  biomeIndex: number; 
}

export interface Quest {
  title: string;
  description: string;
  targetMonster: string;
  targetCount: number;
  currentCount: number;
  reward: string;
  rewardExp: number;
  isCompleted: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  icon: string;
  reqLevel: number;
  reqSkill?: string;
  classType: ClassType | 'All';
  type: 'passive' | 'active' | 'buff'; 
  mpCost?: number;
  cooldown?: number; 
  damageMult?: number; 
  col: number; 
  row: number; 
  duration?: number; 
}

export interface KeyBindings {
    LEFT: string;
    RIGHT: string;
    UP: string; // Added for completeness though mostly jump
    DOWN: string; // Added for down attack
    JUMP: string;
    ATTACK: string;
    POTION_HP: string;
    POTION_MP: string;
    MENU_SHOP: string;
    MENU_MAP: string;
    MENU_SKILL: string;
    WEAPON_1: string;
    WEAPON_2: string;
    WEAPON_3: string;
    WEAPON_4: string;
    SKILL_1: string;
    SKILL_2: string;
    SKILL_3: string;
    SKILL_4: string;
    SKILL_5: string;
}

export interface MobileControlSettings {
    dpadX: number; // % from left
    dpadY: number; // % from bottom
    actionX: number; // % from right
    actionY: number; // % from bottom
    scale: number; // Scale multiplier
    opacity: number; // 0.0 - 1.0
}
