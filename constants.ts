import { Skill, KeyBindings, ClassType, WeaponType } from './types';

export const GRAVITY = 0.6;
export const FRICTION = 0.8;
export const MOVE_SPEED = 5;
export const JUMP_FORCE = -14;
export const GROUND_Y = 500;
export const VIEWPORT_WIDTH = 1024;
export const VIEWPORT_HEIGHT = 600;

export const BIOMES = [
  { name: 'Peaceful Forest', startStage: 1, endStage: 3, sky: ['#87CEEB', '#E0F7FA'], ground: '#5D4037', top: '#388E3C' },
  { name: 'Sand Dunes', startStage: 4, endStage: 6, sky: ['#FFD700', '#FFA500'], ground: '#E65100', top: '#FBC02D' },
  { name: 'Frozen Peaks', startStage: 7, endStage: 9, sky: ['#000033', '#4a69bd'], ground: '#2f3640', top: '#dcdde1' },
  { name: 'Cyber City', startStage: 10, endStage: 12, sky: ['#0f0c29', '#302b63'], ground: '#000000', top: '#00ffcc' },
  { name: 'Celestial Realm', startStage: 13, endStage: 15, sky: ['#ffffff', '#74ebd5'], ground: '#ece9e6', top: '#f1c40f' },
  { name: 'Burning Hell', startStage: 16, endStage: 99, sky: ['#2d0000', '#b71540'], ground: '#1e0000', top: '#800000' }
];

export const CLASS_INFOS: Record<ClassType, { name: string, desc: string, icon: string, weapon: WeaponType }> = {
    Warrior: { name: '검사', desc: '강인한 체력과 근접 공격으로 적을 압도하는 전사입니다.', icon: '🛡️', weapon: 'Sword' },
    Lancer: { name: '창사', desc: '긴 리치를 활용하여 다수의 적을 제압하는 창술사입니다.', icon: '🔱', weapon: 'Spear' },
    Archer: { name: '궁사', desc: '원거리에서 치명적인 화살을 날리는 날렵한 사냥꾼입니다.', icon: '🏹', weapon: 'Bow' },
    Gunner: { name: '총사', desc: '화력과 기계 공학을 이용하여 전장을 지배하는 기술자입니다.', icon: '🔫', weapon: 'Gun' },
    Mage: { name: '마법사', desc: '원소 마법과 신비로운 힘으로 적을 섬멸하는 현자입니다.', icon: '🔮', weapon: 'Sword' },
};

export const ADVANCED_CLASS_NAMES: Record<ClassType, string> = {
    Warrior: '버서커', // Berserker
    Lancer: '용기사', // Dragon Knight
    Archer: '저격수', // Sniper
    Gunner: '캡틴',   // Captain
    Mage: '아크메이지' // Archmage
};

// Added isRanged property for specific enemies
export const ENEMY_TYPES = {
  // Forest
  Snail: { emoji: '🐌', hp: 15, damage: 1, exp: 5, width: 30, height: 25, speed: 0.5, dropName: '달팽이 껍질', dropEmoji: '🐚', isRanged: false },
  Slime: { emoji: '💧', hp: 30, damage: 3, exp: 10, width: 40, height: 40, speed: 1, dropName: '물방울', dropEmoji: '🔮', isRanged: false },
  Mushroom: { emoji: '🍄', hp: 50, damage: 5, exp: 20, width: 45, height: 45, speed: 1.5, dropName: '버섯 갓', dropEmoji: '🍱', isRanged: false },
  Boar: { emoji: '🐗', hp: 80, damage: 8, exp: 25, width: 50, height: 40, speed: 2.5, dropName: '멧돼지 고기', dropEmoji: '🍖', isRanged: false },
  
  // Desert
  Cactus: { emoji: '🌵', hp: 80, damage: 10, exp: 40, width: 40, height: 60, speed: 0.8, dropName: '선인장 꽃', dropEmoji: '🌺', isRanged: true, projectile: '🌵' },
  Scorpion: { emoji: '🦂', hp: 100, damage: 15, exp: 60, width: 50, height: 35, speed: 2.5, dropName: '전갈 꼬리', dropEmoji: '🥐', isRanged: false },
  Snake: { emoji: '🐍', hp: 90, damage: 12, exp: 50, width: 50, height: 30, speed: 2, dropName: '뱀 비늘', dropEmoji: '🎫', isRanged: false },
  Vulture: { emoji: '🦅', hp: 70, damage: 18, exp: 55, width: 50, height: 50, speed: 3.5, dropName: '깃털', dropEmoji: '🪶', isRanged: true, projectile: '🦴' },

  // Snow
  Wolf: { emoji: '🐺', hp: 150, damage: 20, exp: 100, width: 60, height: 50, speed: 3.5, dropName: '늑대 털', dropEmoji: '🧶', isRanged: false },
  Yeti: { emoji: '🦍', hp: 300, damage: 30, exp: 200, width: 80, height: 80, speed: 1.5, dropName: '예티의 뿔', dropEmoji: '🦴', isRanged: false },
  Penguin: { emoji: '🐧', hp: 120, damage: 15, exp: 80, width: 40, height: 45, speed: 1.0, dropName: '생선', dropEmoji: '🐟', isRanged: true, projectile: '🐟' },
  IceGolem: { emoji: '🧊', hp: 400, damage: 40, exp: 250, width: 70, height: 70, speed: 0.5, dropName: '얼음 조각', dropEmoji: '💎', isRanged: false },

  // Cyber City
  Robot: { emoji: '🤖', hp: 400, damage: 35, exp: 250, width: 50, height: 60, speed: 1.5, dropName: '부품', dropEmoji: '⚙️', isRanged: true, projectile: '⚡' },
  Drone: { emoji: '🛸', hp: 300, damage: 45, exp: 280, width: 40, height: 30, speed: 4, dropName: '배터리', dropEmoji: '🔋', isRanged: true, projectile: '🚨' },
  Cyborg: { emoji: '🦾', hp: 550, damage: 40, exp: 350, width: 55, height: 70, speed: 2.5, dropName: '칩셋', dropEmoji: '💾', isRanged: false },
  Alien: { emoji: '👽', hp: 350, damage: 50, exp: 300, width: 45, height: 60, speed: 3, dropName: '외계 물질', dropEmoji: '🧪', isRanged: true, projectile: '🟢' },

  // Celestial Realm
  Angel: { emoji: '👼', hp: 700, damage: 50, exp: 500, width: 50, height: 60, speed: 3, dropName: '깃털', dropEmoji: '🪶', isRanged: true, projectile: '✨' },
  Guardian: { emoji: '🛡️', hp: 1000, damage: 60, exp: 700, width: 70, height: 80, speed: 1.5, dropName: '성물', dropEmoji: '🏆', isRanged: false },
  Pegasus: { emoji: '🦄', hp: 800, damage: 55, exp: 600, width: 70, height: 60, speed: 4, dropName: '편자', dropEmoji: '✨', isRanged: false },
  CloudSpirit: { emoji: '☁️', hp: 600, damage: 45, exp: 550, width: 60, height: 40, speed: 2, dropName: '구름 조각', dropEmoji: '🌫️', isRanged: true, projectile: '💨' },

  // Volcano
  FireSpirit: { emoji: '🔥', hp: 1200, damage: 70, exp: 800, width: 40, height: 50, speed: 3, dropName: '불의 결정', dropEmoji: '🔴', isRanged: true, projectile: '🔥' },
  Dragon: { emoji: '🐉', hp: 3000, damage: 100, exp: 2000, width: 120, height: 90, speed: 2, dropName: '용의 비늘', dropEmoji: '🛡️', isRanged: true, projectile: '☄️' },
  Zombie: { emoji: '🧟', hp: 1500, damage: 80, exp: 900, width: 50, height: 70, speed: 1, dropName: '썩은 붕대', dropEmoji: '🧻', isRanged: false },
  Demon: { emoji: '👹', hp: 2000, damage: 90, exp: 1200, width: 60, height: 70, speed: 2.5, dropName: '악마의 뿔', dropEmoji: '😈', isRanged: false }
};

// Updated weapons with Advanced Classes
export const WEAPONS: Record<string, { emoji: string, range: number, damageMult: number, cooldown: number, speed: number, type: 'melee' | 'ranged', projectile?: string }> = {
  // Basic Weapons
  Sword: { emoji: '🗡️', range: 80, damageMult: 1.0, cooldown: 20, speed: 0, type: 'melee' },
  Spear: { emoji: '🔱', range: 170, damageMult: 1.2, cooldown: 35, speed: 0, type: 'melee' }, // Range Increased
  Bow: { emoji: '🏹', range: 600, damageMult: 0.8, cooldown: 30, speed: 12, type: 'ranged', projectile: '➹' },
  Gun: { emoji: '🔫', range: 800, damageMult: 0.6, cooldown: 10, speed: 20, type: 'ranged', projectile: '•' }, 
  
  // Advanced Weapons
  Greatsword: { emoji: '⚔️', range: 120, damageMult: 2.5, cooldown: 60, speed: 0, type: 'melee' }, // Warrior -> Berserker
  Polearm: { emoji: '🤺', range: 220, damageMult: 1.8, cooldown: 45, speed: 0, type: 'melee' }, // Range Increased
  Crossbow: { emoji: '🦾', range: 700, damageMult: 2.0, cooldown: 60, speed: 18, type: 'ranged', projectile: '➵' }, // Archer -> Sniper
  Cannon: { emoji: '💣', range: 600, damageMult: 2.2, cooldown: 80, speed: 10, type: 'ranged', projectile: '💣' }, // Gunner -> Captain
  Staff: { emoji: '🪄', range: 500, damageMult: 1.5, cooldown: 25, speed: 12, type: 'ranged', projectile: '✨' }, // Mage -> Archmage
};

export const LEVELS_EXP = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 13000, 18000, 25000, 35000, 50000, 70000, 100000, 150000, 250000, 500000];

export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 60;

// Predefined Quests per Biome Index
export const BIOME_QUESTS = [
    // Forest (Index 0)
    [
        { title: "끈적한 액체", targetMonster: "Slime", count: 5, desc: "슬라임들이 마을을 어지럽히고 있습니다. 슬라임을 잡아 물방울을 모으세요." },
        { title: "느림보 사냥", targetMonster: "Snail", count: 3, desc: "달팽이 껍질이 필요합니다. 달팽이를 사냥하세요." },
        { title: "버섯 요리", targetMonster: "Mushroom", count: 5, desc: "맛있는 버섯전골을 위한 버섯 갓을 모으세요." },
        { title: "멧돼지 습격", targetMonster: "Boar", count: 3, desc: "사나운 멧돼지들이 밭을 망치고 있습니다. 멧돼지 고기를 가져오세요." }
    ],
    // Desert (Index 1)
    [
        { title: "가시 조심", targetMonster: "Cactus", count: 5, desc: "선인장 꽃이 비싸게 팔립니다." },
        { title: "맹독 주의", targetMonster: "Scorpion", count: 4, desc: "전갈의 독침을 조심하며 꼬리를 수집하세요." },
        { title: "뱀 가죽", targetMonster: "Snake", count: 5, desc: "최고급 벨트를 위한 뱀 비늘이 필요합니다." },
        { title: "하늘의 포식자", targetMonster: "Vulture", count: 3, desc: "독수리들이 여행자들을 노리고 있습니다. 깃털을 모아오세요." }
    ],
    // Snow (Index 2)
    [
        { title: "하얀 털", targetMonster: "Wolf", count: 5, desc: "따뜻한 코트를 만들 늑대 털을 구하세요." },
        { title: "설인의 공포", targetMonster: "Yeti", count: 2, desc: "거대한 예티의 뿔을 가져오세요." },
        { title: "펭귄의 생선", targetMonster: "Penguin", count: 4, desc: "귀여운 펭귄들이 훔쳐간 생선을 되찾으세요." },
        { title: "얼음 심장", targetMonster: "IceGolem", count: 2, desc: "움직이는 얼음 덩어리, 아이스 골렘을 파괴하세요." }
    ],
    // Cyber City (Index 3)
    [
        { title: "폭주 로봇", targetMonster: "Robot", count: 5, desc: "오작동하는 로봇들을 멈추고 부품을 회수하세요." },
        { title: "감시자 제거", targetMonster: "Drone", count: 8, desc: "하늘을 날아다니는 드론들이 시민들을 감시합니다." },
        { title: "강력한 사이보그", targetMonster: "Cyborg", count: 3, desc: "강화된 사이보그들이 거리를 점령했습니다." },
        { title: "외계 침공", targetMonster: "Alien", count: 3, desc: "도시 외곽에 나타난 외계인들을 처치하고 물질을 수거하세요." }
    ],
    // Celestial Realm (Index 4)
    [
        { title: "타락한 천사", targetMonster: "Angel", count: 5, desc: "타락한 천사들의 깃털을 모아 정화해야 합니다." },
        { title: "신전 수호자", targetMonster: "Guardian", count: 3, desc: "신전을 지키는 수호자들이 미쳐 날뛰고 있습니다." },
        { title: "전설의 말", targetMonster: "Pegasus", count: 4, desc: "페가수스의 편자가 행운을 가져다 줍니다." },
        { title: "구름 속 그림자", targetMonster: "CloudSpirit", count: 5, desc: "장난꾸러기 구름 정령들을 진정시키세요." }
    ],
    // Volcano (Index 5)
    [
        { title: "불의 정령", targetMonster: "FireSpirit", count: 5, desc: "뜨거운 불의 결정을 수집하세요." },
        { title: "언데드 퇴치", targetMonster: "Zombie", count: 10, desc: "좀비를 처치하고 붕대를 태우세요." },
        { title: "용의 둥지", targetMonster: "Dragon", count: 1, desc: "전설의 드래곤 비늘을 구하세요." },
        { title: "악마의 계약", targetMonster: "Demon", count: 2, desc: "지옥에서 올라온 악마들을 처치하고 뿔을 꺾으세요." }
    ]
];

export const UPGRADE_COSTS = {
    ATK: { base: 100, scale: 1.5 },
    HP: { base: 50, scale: 1.2 },
    MP: { base: 50, scale: 1.2 },
    POTION: 50
};

// ... (Skill Tree remains unchanged) ...
export const SKILL_TREE: Skill[] = [
    // === SHARED (ROW 0) ===
    { id: 'IronBody', name: '신체 단련', description: '최대 체력이 증가합니다.', maxLevel: 10, icon: '💪', reqLevel: 1, col: 0, row: 0, classType: 'All', type: 'passive' },
    { id: 'DoubleJump', name: '이단 점프', description: '공중에서 한 번 더 점프할 수 있습니다.', maxLevel: 1, icon: '🚀', reqLevel: 5, col: 1, row: 0, classType: 'All', type: 'passive' },
    { id: 'Haste', name: '헤이스트', description: '이동 속도가 증가합니다.', maxLevel: 5, icon: '👟', reqLevel: 1, col: 2, row: 0, classType: 'All', type: 'passive' },

    // === WARRIOR (Buffed Damage) ===
    // Lv 10
    { id: 'PowerStrike', name: '파워 스트라이크', description: '강력한 내려치기로 적을 공격합니다.', maxLevel: 10, icon: '💥', reqLevel: 1, col: 0, row: 1, classType: 'Warrior', type: 'active', mpCost: 5, cooldown: 30, damageMult: 2.0 },
    { id: 'SlashBlast', name: '슬래시 블러스트', description: '주변의 적들을 베어버립니다.', maxLevel: 10, icon: '🌪️', reqLevel: 10, col: 1, row: 1, classType: 'Warrior', type: 'active', mpCost: 10, cooldown: 60, damageMult: 2.5, reqSkill: 'PowerStrike' },
    // Lv 20
    { id: 'IronWall', name: '아이언 월', description: '방어력을 높여 받는 피해를 줄입니다. (버프)', maxLevel: 5, icon: '🛡️', reqLevel: 20, col: 0, row: 2, classType: 'Warrior', type: 'buff', mpCost: 20, cooldown: 600, duration: 1800 },
    { id: 'Rush', name: '돌진', description: '전방으로 빠르게 돌진하여 적을 밀어냅니다.', maxLevel: 5, icon: '🏃', reqLevel: 20, col: 1, row: 2, classType: 'Warrior', type: 'active', mpCost: 15, cooldown: 120, damageMult: 1.5 },
    { id: 'WeaponMastery', name: '무기 숙련', description: '무기 공격력이 증가합니다.', maxLevel: 10, icon: '⚔️', reqLevel: 20, col: 2, row: 2, classType: 'Warrior', type: 'passive' },
    // Lv 30
    { id: 'Shout', name: '위협', description: '고함을 질러 주변 적을 기절시킵니다.', maxLevel: 5, icon: '📢', reqLevel: 30, col: 0, row: 3, classType: 'Warrior', type: 'active', mpCost: 20, cooldown: 300, damageMult: 0.8 },
    { id: 'Rage', name: '분노', description: '공격력을 대폭 증가시킵니다. (버프)', maxLevel: 5, icon: '😡', reqLevel: 30, col: 1, row: 3, classType: 'Warrior', type: 'buff', mpCost: 30, cooldown: 900, duration: 1200 },
    { id: 'PowerGuard', name: '반격', description: '피격 시 일정 확률로 데미지를 반사합니다.', maxLevel: 5, icon: '💢', reqLevel: 30, col: 2, row: 3, classType: 'Warrior', type: 'passive' },
    // Lv 40
    { id: 'GroundSmash', name: '지면 강타', description: '땅을 내리찍어 넓은 범위에 충격을 줍니다.', maxLevel: 5, icon: '🔨', reqLevel: 40, col: 0, row: 4, classType: 'Warrior', type: 'active', mpCost: 40, cooldown: 180, damageMult: 3.5 },
    { id: 'DragonBuster', name: '드래곤 버스터', description: '용의 힘으로 연속 공격을 퍼붓습니다.', maxLevel: 5, icon: '🐉', reqLevel: 40, col: 1, row: 4, classType: 'Warrior', type: 'active', mpCost: 50, cooldown: 180, damageMult: 5.5 },
    { id: 'Achilles', name: '아킬레스', description: '영구적으로 방어력이 증가합니다.', maxLevel: 5, icon: '🦵', reqLevel: 40, col: 2, row: 4, classType: 'Warrior', type: 'passive' },
    // Lv 50
    { id: 'Brandish', name: '브랜디쉬', description: '전방의 적을 두 번 연속 베어버립니다.', maxLevel: 5, icon: '⚔️', reqLevel: 50, col: 0, row: 5, classType: 'Warrior', type: 'active', mpCost: 40, cooldown: 60, damageMult: 3.5 },
    { id: 'Enrage', name: '광폭화', description: '짧은 시간 동안 공격력이 극대화됩니다.', maxLevel: 1, icon: '👺', reqLevel: 50, col: 1, row: 5, classType: 'Warrior', type: 'buff', mpCost: 100, cooldown: 1800, duration: 600 },

    // === LANCER (Buffed Damage) ===
    // Lv 10
    { id: 'DoubleStab', name: '더블 스탭', description: '창을 빠르게 두 번 찌릅니다.', maxLevel: 10, icon: '🥢', reqLevel: 1, col: 0, row: 1, classType: 'Lancer', type: 'active', mpCost: 5, cooldown: 30, damageMult: 1.8 },
    { id: 'SpearCrusher', name: '스피어 크러셔', description: '창을 크게 휘둘러 다수를 공격합니다.', maxLevel: 10, icon: '🌬️', reqLevel: 10, col: 1, row: 1, classType: 'Lancer', type: 'active', mpCost: 15, cooldown: 60, damageMult: 2.5, reqSkill: 'DoubleStab' },
    // Lv 20
    { id: 'LeapAttack', name: '리프 어택', description: '높이 점프하여 강하게 내려찍습니다.', maxLevel: 5, icon: '🦗', reqLevel: 20, col: 0, row: 2, classType: 'Lancer', type: 'active', mpCost: 20, cooldown: 120, damageMult: 3.0 },
    { id: 'Guard', name: '가드', description: '짧은 시간 동안 무적 상태가 됩니다.', maxLevel: 1, icon: '🙅', reqLevel: 20, col: 1, row: 2, classType: 'Lancer', type: 'active', mpCost: 15, cooldown: 300, damageMult: 0 },
    { id: 'PolearmMastery', name: '창 숙련', description: '창 공격력과 명중률이 증가합니다.', maxLevel: 10, icon: '🔱', reqLevel: 20, col: 2, row: 2, classType: 'Lancer', type: 'passive' },
    // Lv 30
    { id: 'DragonRoar', name: '용의 포효', description: '화면 전체의 적을 위협하여 피해를 줍니다.', maxLevel: 5, icon: '🦁', reqLevel: 30, col: 0, row: 3, classType: 'Lancer', type: 'active', mpCost: 60, cooldown: 300, damageMult: 4.0 },
    { id: 'DragonBlood', name: '용의 피', description: '체력을 서서히 소모하여 공격력을 올립니다.', maxLevel: 5, icon: '🩸', reqLevel: 30, col: 1, row: 3, classType: 'Lancer', type: 'buff', mpCost: 20, cooldown: 900, duration: 1200 },
    { id: 'Reach', name: '리치', description: '창의 공격 범위가 증가합니다.', maxLevel: 5, icon: '📏', reqLevel: 30, col: 2, row: 3, classType: 'Lancer', type: 'passive' },
    // Lv 40
    { id: 'SpearPanic', name: '패닉', description: '적의 방어력을 무시하는 강력한 찌르기.', maxLevel: 5, icon: '😱', reqLevel: 40, col: 0, row: 4, classType: 'Lancer', type: 'active', mpCost: 30, cooldown: 120, damageMult: 5.5 },
    { id: 'Sacrifice', name: '새크리파이스', description: '자신의 체력을 깎아 적에게 큰 피해를 줍니다.', maxLevel: 5, icon: '☠️', reqLevel: 40, col: 1, row: 4, classType: 'Lancer', type: 'active', mpCost: 0, cooldown: 60, damageMult: 7.0 },
    // Lv 50
    { id: 'DragonFury', name: '드래곤 퓨리', description: '체력이 일정 수준 이하일 때 공격력이 폭발합니다.', maxLevel: 5, icon: '🔥', reqLevel: 50, col: 0, row: 5, classType: 'Lancer', type: 'passive' },
    { id: 'Earthquake', name: '지진', description: '땅을 뒤흔들어 광역 피해를 주고 느리게 합니다.', maxLevel: 5, icon: '🌋', reqLevel: 50, col: 1, row: 5, classType: 'Lancer', type: 'active', mpCost: 80, cooldown: 400, damageMult: 3.5 },

    // === ARCHER (ROW 1-5) ===
    // Lv 10
    { id: 'ArrowBlow', name: '애로우 블로우', description: '강력한 화살 한 발을 발사합니다.', maxLevel: 10, icon: '🏹', reqLevel: 1, col: 0, row: 1, classType: 'Archer', type: 'active', mpCost: 5, cooldown: 30, damageMult: 1.4 },
    { id: 'MultiShot', name: '멀티 샷', description: '부채꼴 모양으로 여러 발의 화살을 쏩니다.', maxLevel: 10, icon: '📶', reqLevel: 10, col: 1, row: 1, classType: 'Archer', type: 'active', mpCost: 12, cooldown: 60, damageMult: 1.0, reqSkill: 'ArrowBlow' },
    // Lv 20
    { id: 'Backstep', name: '백스텝', description: '뒤로 빠르게 회피하며 화살을 쏩니다.', maxLevel: 1, icon: '🔙', reqLevel: 20, col: 0, row: 2, classType: 'Archer', type: 'active', mpCost: 10, cooldown: 120, damageMult: 1.0 },
    { id: 'FireShot', name: '파이어 샷', description: '폭발하는 불화살을 쏘아 주변에 피해를 줍니다.', maxLevel: 5, icon: '🔥', reqLevel: 20, col: 1, row: 2, classType: 'Archer', type: 'active', mpCost: 20, cooldown: 90, damageMult: 2.5 },
    { id: 'BowMastery', name: '활 숙련', description: '활 공격력과 사거리가 증가합니다.', maxLevel: 10, icon: '🎯', reqLevel: 20, col: 2, row: 2, classType: 'Archer', type: 'passive' },
    // Lv 30
    { id: 'IceShot', name: '아이스 샷', description: '적을 얼리는 빙결 화살을 발사합니다.', maxLevel: 5, icon: '❄️', reqLevel: 30, col: 0, row: 3, classType: 'Archer', type: 'active', mpCost: 25, cooldown: 120, damageMult: 2.0 },
    { id: 'SnareTrap', name: '덫 설치', description: '적을 묶고 피해를 주는 덫을 설치합니다.', maxLevel: 5, icon: '🕸️', reqLevel: 30, col: 1, row: 3, classType: 'Archer', type: 'active', mpCost: 15, cooldown: 180, damageMult: 2.0 },
    { id: 'Concentrate', name: '집중', description: '일시적으로 공격력과 회피율이 증가합니다. (버프)', maxLevel: 5, icon: '🧘‍♂️', reqLevel: 30, col: 2, row: 3, classType: 'Archer', type: 'buff', mpCost: 30, cooldown: 1200, duration: 900 },
    // Lv 40
    { id: 'ArrowRain', name: '폭풍의 시', description: '하늘에서 화살 비를 내리게 합니다.', maxLevel: 5, icon: '🌧️', reqLevel: 40, col: 0, row: 4, classType: 'Archer', type: 'active', mpCost: 50, cooldown: 240, damageMult: 2.5 },
    { id: 'Phoenix', name: '피닉스', description: '불새를 소환하여 주변 적을 자동 공격합니다.', maxLevel: 5, icon: '🦅', reqLevel: 40, col: 1, row: 4, classType: 'Archer', type: 'active', mpCost: 60, cooldown: 600, damageMult: 1.5 },
    // Lv 50
    { id: 'Strafe', name: '스트레이프', description: '보이지 않는 속도로 4발의 화살을 연사합니다.', maxLevel: 5, icon: '🎰', reqLevel: 50, col: 0, row: 5, classType: 'Archer', type: 'active', mpCost: 30, cooldown: 60, damageMult: 0.8 },
    { id: 'SharpEyes', name: '샤프 아이즈', description: '치명타 확률과 치명타 데미지가 증가합니다. (버프)', maxLevel: 5, icon: '👁️', reqLevel: 50, col: 1, row: 5, classType: 'Archer', type: 'buff', mpCost: 50, cooldown: 1800, duration: 1200 },

    // === GUNNER (ROW 1-5) ===
    // Lv 10
    { id: 'DoubleShot', name: '더블 샷', description: '총알을 두 발 연속 발사합니다.', maxLevel: 10, icon: '🔫', reqLevel: 1, col: 0, row: 1, classType: 'Gunner', type: 'active', mpCost: 5, cooldown: 20, damageMult: 0.8 },
    { id: 'Grenade', name: '수류탄', description: '폭발하는 수류탄을 투척합니다.', maxLevel: 5, icon: '💣', reqLevel: 10, col: 1, row: 1, classType: 'Gunner', type: 'active', mpCost: 20, cooldown: 120, damageMult: 3.0 },
    // Lv 20
    { id: 'Flamethrower', name: '화염방사기', description: '전방에 화염을 뿜어 지속 피해를 줍니다.', maxLevel: 5, icon: '🔥', reqLevel: 20, col: 0, row: 2, classType: 'Gunner', type: 'active', mpCost: 10, cooldown: 60, damageMult: 0.5 },
    { id: 'C4', name: 'C4 설치', description: '지면에 닿으면 폭발하는 폭탄을 설치합니다.', maxLevel: 5, icon: '🧨', reqLevel: 20, col: 1, row: 2, classType: 'Gunner', type: 'active', mpCost: 15, cooldown: 180, damageMult: 4.0 },
    { id: 'GunMastery', name: '총기 숙련', description: '총기 공격력과 사거리가 증가합니다.', maxLevel: 10, icon: '🔧', reqLevel: 20, col: 2, row: 2, classType: 'Gunner', type: 'passive' },
    // Lv 30
    { id: 'IceSplitter', name: '아이스 스플리터', description: '파편이 튀는 냉기탄을 쏘아 적을 얼립니다.', maxLevel: 5, icon: '❄️', reqLevel: 30, col: 0, row: 3, classType: 'Gunner', type: 'active', mpCost: 25, cooldown: 120, damageMult: 2.0 },
    { id: 'Turret', name: '터렛 설치', description: '자동으로 적을 공격하는 터렛을 설치합니다.', maxLevel: 5, icon: '🤖', reqLevel: 30, col: 1, row: 3, classType: 'Gunner', type: 'active', mpCost: 40, cooldown: 600, damageMult: 1.0 },
    { id: 'HomingMissile', name: '호밍 미사일', description: '적을 추적하는 미사일을 발사합니다.', maxLevel: 5, icon: '🚀', reqLevel: 30, col: 2, row: 3, classType: 'Gunner', type: 'active', mpCost: 30, cooldown: 150, damageMult: 3.5 },
    // Lv 40
    { id: 'RapidFire', name: '래피드 파이어', description: '보이지 않을 정도로 빠르게 난사합니다.', maxLevel: 5, icon: '🎰', reqLevel: 40, col: 0, row: 4, classType: 'Gunner', type: 'active', mpCost: 8, cooldown: 10, damageMult: 1.0 },
    { id: 'AirStrike', name: '공중 폭격', description: '무전을 쳐서 공중 폭격을 요청합니다.', maxLevel: 5, icon: '✈️', reqLevel: 40, col: 1, row: 4, classType: 'Gunner', type: 'active', mpCost: 60, cooldown: 300, damageMult: 5.0 },
    // Lv 50
    { id: 'Battleship', name: '배틀쉽', description: '배틀쉽에 탑승하여 방어력과 공격력이 증가합니다. (버프)', maxLevel: 1, icon: '🚢', reqLevel: 50, col: 0, row: 5, classType: 'Gunner', type: 'buff', mpCost: 100, cooldown: 1800, duration: 1200 },
    { id: 'LuckyDice', name: '럭키 다이스', description: '랜덤한 버프를 획득합니다.', maxLevel: 5, icon: '🎲', reqLevel: 50, col: 1, row: 5, classType: 'Gunner', type: 'buff', mpCost: 30, cooldown: 600, duration: 600 },

    // === MAGE (ROW 1-5) ===
    // Lv 10
    { id: 'MagicClaw', name: '매직 클로', description: '마법의 손톱으로 적을 할큅니다.', maxLevel: 10, icon: '🖐️', reqLevel: 1, col: 0, row: 1, classType: 'Mage', type: 'active', mpCost: 8, cooldown: 30, damageMult: 1.3 },
    { id: 'Thunderbolt', name: '썬더볼트', description: '주변 적들에게 번개를 내리꽂습니다.', maxLevel: 10, icon: '⚡', reqLevel: 10, col: 1, row: 1, classType: 'Mage', type: 'active', mpCost: 25, cooldown: 60, damageMult: 1.5 },
    // Lv 20
    { id: 'Heal', name: '힐', description: '자신의 체력을 회복합니다.', maxLevel: 5, icon: '💖', reqLevel: 20, col: 0, row: 2, classType: 'Mage', type: 'active', mpCost: 30, cooldown: 300, damageMult: 0 },
    { id: 'ColdBeam', name: '콜드 빔', description: '적을 얼리는 얼음 기둥을 소환합니다.', maxLevel: 5, icon: '🧊', reqLevel: 20, col: 1, row: 2, classType: 'Mage', type: 'active', mpCost: 20, cooldown: 90, damageMult: 2.0 },
    { id: 'MPRestore', name: 'MP 회복력 향상', description: 'MP 회복 속도가 빨라집니다.', maxLevel: 10, icon: '🧘', reqLevel: 20, col: 2, row: 2, classType: 'Mage', type: 'passive' },
    // Lv 30
    { id: 'Teleport', name: '텔레포트', description: '일정 거리를 순간이동합니다.', maxLevel: 1, icon: '🌀', reqLevel: 30, col: 0, row: 3, classType: 'Mage', type: 'active', mpCost: 20, cooldown: 30, damageMult: 0 },
    { id: 'FireBall', name: '파이어볼', description: '폭발하는 화염구를 발사합니다.', maxLevel: 5, icon: '☄️', reqLevel: 30, col: 1, row: 3, classType: 'Mage', type: 'active', mpCost: 30, cooldown: 90, damageMult: 3.0 },
    { id: 'MagicGuard', name: '매직 가드', description: '받는 피해의 일부를 MP로 대신합니다. (패시브)', maxLevel: 5, icon: '🛡️', reqLevel: 30, col: 2, row: 3, classType: 'Mage', type: 'passive' },
    // Lv 40
    { id: 'Meteor', name: '메테오', description: '거대한 운석을 소환하여 전장을 초토화합니다.', maxLevel: 5, icon: '🌠', reqLevel: 40, col: 0, row: 4, classType: 'Mage', type: 'active', mpCost: 100, cooldown: 400, damageMult: 10.0 },
    { id: 'Slow', name: '슬로우', description: '주변 적들의 이동속도를 느리게 합니다.', maxLevel: 5, icon: '🐢', reqLevel: 40, col: 1, row: 4, classType: 'Mage', type: 'active', mpCost: 40, cooldown: 300, damageMult: 0 },
    // Lv 50
    { id: 'Blizzard', name: '블리자드', description: '화면 전체에 눈보라를 일으켜 적을 얼립니다.', maxLevel: 5, icon: '🌨️', reqLevel: 50, col: 0, row: 5, classType: 'Mage', type: 'active', mpCost: 120, cooldown: 500, damageMult: 8.0 },
    { id: 'Bahamut', name: '바하뮤트', description: '성스러운 용을 소환하여 적을 공격합니다.', maxLevel: 5, icon: '🐉', reqLevel: 50, col: 1, row: 5, classType: 'Mage', type: 'active', mpCost: 100, cooldown: 900, damageMult: 2.0 },
];

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    JUMP: 'Space',
    ATTACK: 'KeyZ', 
    POTION_HP: 'KeyQ',
    POTION_MP: 'KeyW',
    MENU_SHOP: 'KeyB',
    MENU_MAP: 'KeyM',
    MENU_SKILL: 'KeyK',
    WEAPON_1: 'Digit1',
    WEAPON_2: 'Digit2',
    WEAPON_3: 'Digit3',
    WEAPON_4: 'Digit4',
    SKILL_1: 'KeyA', 
    SKILL_2: 'KeyS', 
    SKILL_3: 'KeyD', 
    SKILL_4: 'KeyF', 
    SKILL_5: 'KeyG' 
};