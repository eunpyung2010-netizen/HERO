
import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
    Player, Enemy, Projectile, Particle, Item, GameState, 
    Quest, KeyBindings, ClassType, WeaponType, Entity, Rect, Lightning 
} from '../types';
import { 
    GRAVITY, FRICTION, MOVE_SPEED, JUMP_FORCE, GROUND_Y, 
    VIEWPORT_WIDTH, VIEWPORT_HEIGHT, BIOMES, ENEMY_TYPES, 
    WEAPONS, LEVELS_EXP, PLAYER_WIDTH, PLAYER_HEIGHT, 
    SKILL_TREE, CLASS_INFOS, ADVANCED_CLASS_NAMES, UPGRADE_COSTS 
} from '../constants';
import { SoundService } from '../services/soundService';
import { getRandomChat } from '../services/gameService';

export interface GameCanvasHandle {
    purchasePotion: (type: 'HP' | 'MP') => boolean;
    upgradeStat: (type: 'ATK' | 'HP' | 'MP', cost: number) => boolean;
    switchWeapon: (weapon: WeaponType) => void;
    upgradeSkill: (skillId: string) => void;
    assignSkillSlot: (skillId: string, slotKey: string) => string;
    jobAdvance: () => void;
    unlockAllSkills: () => void;
}

interface GameCanvasProps {
    onStatsUpdate: (player: Player, boss: Enemy | null, stageLevel: number, biomeName: string) => void;
    onEventLog: (msg: string) => void;
    onGameOver: () => void;
    onQuestUpdate: (count: number) => void;
    onQuestComplete: (exp: number, gold: number) => void;
    gameActive: boolean;
    currentQuest: Quest | null;
    keyBindings: KeyBindings;
    initialClass?: ClassType;
}

const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({ 
    onStatsUpdate, onEventLog, onGameOver, onQuestUpdate, onQuestComplete, 
    gameActive, currentQuest, keyBindings, initialClass 
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const keysPressed = useRef<Set<string>>(new Set());
    
    // Refs to avoid stale closures in game loop
    const gameActiveRef = useRef(gameActive);
    const keyBindingsRef = useRef(keyBindings);
    const currentQuestRef = useRef(currentQuest);

    useEffect(() => { gameActiveRef.current = gameActive; }, [gameActive]);
    useEffect(() => { keyBindingsRef.current = keyBindings; }, [keyBindings]);
    useEffect(() => { currentQuestRef.current = currentQuest; }, [currentQuest]);

    // Mutable Game State
    const state = useRef<GameState>({
        player: null as any, 
        enemies: [],
        particles: [],
        projectiles: [],
        platforms: [],
        items: [],
        lightnings: [],
        cameraX: 0,
        worldWidth: 3000,
        stageLevel: 1,
        shakeTimer: 0,
        biomeIndex: 0
    });

    const lastTime = useRef<number>(0);
    const spawnTimer = useRef<number>(0);
    const damageNumbers = useRef<{x: number, y: number, text: string, life: number, color: string, vy: number}[]>([]);

    // Helper to generate platforms
    const generatePlatforms = (worldWidth: number) => {
        const platforms: Rect[] = [];
        // Ground
        platforms.push({ x: -1000, y: GROUND_Y, width: worldWidth + 2000, height: 200 });
        
        // Random Platforms
        const count = 10 + Math.floor(worldWidth / 300);
        for(let i = 0; i < count; i++) {
            const w = 150 + Math.random() * 200;
            const x = 400 + Math.random() * (worldWidth - 800);
            const y = GROUND_Y - 100 - Math.random() * 250;
            
            // Avoid overlapping too much (simple check)
            if (!platforms.some(p => Math.abs(p.x - x) < 100 && Math.abs(p.y - y) < 50)) {
                platforms.push({ x, y, width: w, height: 20 });
            }
        }
        return platforms;
    };

    // Initialize Game
    useEffect(() => {
        const cls = initialClass || 'Warrior';
        const info = CLASS_INFOS[cls];
        
        state.current.player = {
            id: 'player', x: 100, y: GROUND_Y - PLAYER_HEIGHT, width: PLAYER_WIDTH, height: PLAYER_HEIGHT,
            vx: 0, vy: 0, color: 'blue', emoji: info.icon, direction: 1, isDead: false,
            hp: 100, maxHp: 100, mp: 100, maxMp: 100, shield: 0,
            level: 1, exp: 0, maxExp: LEVELS_EXP[1], attack: 10,
            name: info.name, classType: cls, isAdvanced: false,
            isAttacking: false, isDownAttacking: false, attackCooldown: 0, maxAttackCooldown: 20,
            currentWeapon: info.weapon, unlockedWeapons: [info.weapon],
            weaponRotation: 0, invincibilityTimer: 0, gold: 0,
            hpPotions: 3, mpPotions: 3, maxStageReached: 1, sp: 0,
            skills: {}, skillSlots: {}, cooldowns: {}, jumps: 0, maxJumps: 1,
            buffs: {}
        };
        
        state.current.worldWidth = 3000;
        state.current.platforms = generatePlatforms(state.current.worldWidth);
        state.current.enemies = [];
        state.current.projectiles = [];
        state.current.particles = [];
        state.current.items = [];
        state.current.stageLevel = 1;
        state.current.biomeIndex = 0;
        state.current.cameraX = 0;

        // Reset time to prevent huge dt on start
        lastTime.current = performance.now();

        // Start Loop
        requestRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [initialClass]);

    // Input Handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!gameActive) return;
            keysPressed.current.add(e.code);
            
            const player = state.current.player;
            if (player && !player.isDead) {
                if (e.code === keyBindings.POTION_HP) usePotion('HP');
                if (e.code === keyBindings.POTION_MP) usePotion('MP');
                if (e.code === keyBindings.SKILL_1) useSkill(player.skillSlots[keyBindings.SKILL_1]);
                if (e.code === keyBindings.SKILL_2) useSkill(player.skillSlots[keyBindings.SKILL_2]);
                if (e.code === keyBindings.SKILL_3) useSkill(player.skillSlots[keyBindings.SKILL_3]);
                if (e.code === keyBindings.SKILL_4) useSkill(player.skillSlots[keyBindings.SKILL_4]);
                if (e.code === keyBindings.SKILL_5) useSkill(player.skillSlots[keyBindings.SKILL_5]);
                
                if (e.code === keyBindings.WEAPON_1 && player.unlockedWeapons[0]) switchWeapon(player.unlockedWeapons[0]);
                if (e.code === keyBindings.WEAPON_2 && player.unlockedWeapons[1]) switchWeapon(player.unlockedWeapons[1]);
                if (e.code === keyBindings.WEAPON_3 && player.unlockedWeapons[2]) switchWeapon(player.unlockedWeapons[2]);
                if (e.code === keyBindings.WEAPON_4 && player.unlockedWeapons[3]) switchWeapon(player.unlockedWeapons[3]);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressed.current.delete(e.code);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameActive, keyBindings]);

    // --- Logic Helpers ---

    const usePotion = (type: 'HP' | 'MP') => {
        const p = state.current.player;
        if (type === 'HP' && p.hpPotions > 0 && p.hp < p.maxHp) {
            p.hpPotions--;
            heal(50);
            SoundService.playDrink();
        } else if (type === 'MP' && p.mpPotions > 0 && p.mp < p.maxMp) {
            p.mpPotions--;
            restoreMp(50);
            SoundService.playDrink();
        }
    };

    const heal = (amount: number) => {
        const p = state.current.player;
        p.hp = Math.min(p.hp + amount, p.maxHp);
        spawnDamageNumber(p.x, p.y, `+${amount}`, 'green');
    };
    
    const restoreMp = (amount: number) => {
        const p = state.current.player;
        p.mp = Math.min(p.mp + amount, p.maxMp);
    };

    const switchWeapon = (weapon: WeaponType) => {
        const p = state.current.player;
        if (p.unlockedWeapons.includes(weapon)) {
            p.currentWeapon = weapon;
            SoundService.playEquip();
            onEventLog(`무기 변경: ${WEAPONS[weapon].emoji}`);
        }
    };

    const useSkill = (skillId: string) => {
        const p = state.current.player;
        if (!skillId || p.isDead) return;
        
        const skill = SKILL_TREE.find(s => s.id === skillId);
        if (!skill) return;

        if ((p.cooldowns[skillId] || 0) > 0) {
            onEventLog("아직 사용할 수 없습니다.");
            return;
        }

        if (skill.mpCost && p.mp < skill.mpCost) {
            onEventLog("MP가 부족합니다.");
            return;
        }

        if (skill.mpCost) p.mp -= skill.mpCost;
        p.cooldowns[skillId] = skill.cooldown || 0;

        // Visual Effects for Buffs/Active Skills
        if (skill.type === 'buff') {
            SoundService.playLevelUp(); 
            spawnDamageNumber(p.x, p.y, skill.name, 'cyan');
            // Buff Aura Effect
            state.current.particles.push({ 
                id: Math.random().toString(), 
                x: p.x + p.width/2, y: p.y + p.height, 
                text: '', color: 'rgba(255, 255, 0, 0.5)', 
                life: 30, maxLife: 30, vx: 0, vy: -5,
                shape: 'pillar', width: 40, height: 80
            });
            p.buffs[skill.id] = skill.duration || 600;
        }

        switch (skill.id) {
            case 'PowerStrike':
            case 'SlashBlast':
            case 'DoubleStab':
            case 'SpearCrusher':
            case 'GroundSmash':
            case 'Brandish':
            case 'SpearPanic':
                // Melee Slash Effect
                state.current.particles.push({
                    id: Math.random().toString(),
                    x: p.x + (p.direction * 30), y: p.y + 10,
                    text: '', color: skill.id === 'PowerStrike' ? '#ffcc00' : '#ff4444',
                    life: 15, maxLife: 15, vx: p.direction * 2, vy: 0,
                    shape: 'slash', width: 100, height: 100, rotation: p.direction === 1 ? 0 : 180
                });
                performAttack(skill);
                break;
                
            case 'Thunderbolt':
                SoundService.playMagicThunder();
                // Find enemies nearby
                const targets = state.current.enemies.filter(e => 
                    !e.isDead && Math.abs(e.x - p.x) < 400 && Math.abs(e.y - p.y) < 150
                );
                
                targets.forEach(e => {
                    // Lightning Effect
                    state.current.particles.push({
                        id: Math.random().toString(),
                        x: p.x + p.width/2, y: p.y + p.height/2,
                        text: '', color: '#00ffff',
                        life: 20, maxLife: 20, vx: 0, vy: 0,
                        shape: 'lightning', targetX: e.x + e.width/2, targetY: e.y + e.height/2
                    });
                    damageEnemy(e, p.attack * (skill.damageMult || 1.5));
                });
                if (targets.length === 0) performAttack(skill); // Fallback
                break;
                
            case 'ColdBeam':
            case 'IceShot':
            case 'Blizzard':
                 SoundService.playMagicIce();
                 const iceTargets = state.current.enemies.filter(e => 
                    !e.isDead && Math.abs(e.x - p.x) < (skill.id === 'Blizzard' ? 800 : 300)
                 );
                 iceTargets.forEach(e => {
                    state.current.particles.push({
                        id: Math.random().toString(),
                        x: e.x + e.width/2, y: e.y + e.height,
                        text: '', color: '#aaddff',
                        life: 40, maxLife: 40, vx: 0, vy: -1,
                        shape: 'pillar', width: 50, height: 100
                    });
                    damageEnemy(e, p.attack * (skill.damageMult || 2.0));
                 });
                 if (iceTargets.length === 0) performAttack(skill);
                 break;

            case 'Heal':
                heal(p.maxHp * 0.5);
                state.current.particles.push({ id: Math.random().toString(), x: p.x, y: p.y - 50, text: '💖', color: 'pink', life: 40, maxLife: 40, vx: 0, vy: -1, shape: 'text' });
                // Ring Effect
                state.current.particles.push({ 
                    id: Math.random().toString(), x: p.x + p.width/2, y: p.y + p.height/2, 
                    text: '', color: 'rgba(255, 200, 200, 0.5)', life: 30, maxLife: 30, 
                    vx: 0, vy: 0, shape: 'ring', scale: 1 
                });
                break;
                
            case 'ArrowRain':
            case 'Meteor':
                // Rain from sky
                const rainCount = 10;
                for(let i=0; i<rainCount; i++) {
                    setTimeout(() => {
                        const targetX = p.x + (Math.random() - 0.5) * 600;
                        state.current.projectiles.push({
                            id: Math.random().toString(),
                            x: targetX, y: 0,
                            width: 20, height: 40,
                            vx: (Math.random()-0.5)*2, vy: 15,
                            damage: p.attack * (skill.damageMult || 2),
                            color: skill.id === 'Meteor' ? '#ff4400' : '#ffff00',
                            emoji: skill.id === 'Meteor' ? '☄️' : '🏹',
                            life: 100, isDead: false, isMagic: true, skillId: skill.id
                        });
                    }, i * 100);
                }
                break;

            case 'Teleport':
                state.current.particles.push({ 
                    id: Math.random().toString(), x: p.x + p.width/2, y: p.y + p.height/2, 
                    text: '', color: '#aaf', life: 15, maxLife: 15, vx: 0, vy: 0, shape: 'ring', scale: 0.5
                });
                p.x += p.direction * 250;
                SoundService.playMagicFireball(); 
                break;
                
            default:
                performAttack(skill);
                break;
        }
    };

    const performAttack = (skill?: any) => {
        const p = state.current.player;
        
        // Setup cooldown and state
        p.attackCooldown = skill ? 20 : p.maxAttackCooldown; 
        
        if (skill) {
             if (skill.classType === 'Mage') SoundService.playMagicFireball();
             else SoundService.playAttack();
        } else {
             SoundService.playAttack();
             // Default Attack Slash
             const weapon = WEAPONS[p.currentWeapon];
             if (weapon.type === 'melee') {
                 state.current.particles.push({
                    id: Math.random().toString(),
                    x: p.x + (p.direction * 20), y: p.y + 15,
                    text: '', color: '#ffffff',
                    life: 10, maxLife: 10, vx: p.direction * 1, vy: 0,
                    shape: 'slash', width: 80, height: 80, rotation: p.direction === 1 ? 0 : 180
                });
             }
        }

        const weapon = WEAPONS[p.currentWeapon];
        const damageMult = (skill?.damageMult || 1) * (weapon.damageMult || 1);
        const range = (skill ? weapon.range * 1.5 : weapon.range);

        if (weapon.type === 'ranged' || (skill && skill.classType === 'Mage')) {
            const projId = Math.random().toString(36).substr(2, 9);
            const isMagic = skill?.classType === 'Mage';
            state.current.projectiles.push({
                id: projId,
                x: p.direction === 1 ? p.x + p.width : p.x,
                y: p.y + p.height / 2 - 10,
                width: 20, height: 20,
                vx: p.direction * (weapon.speed || 15),
                vy: 0,
                damage: p.attack * damageMult,
                color: isMagic ? '#55f' : '#fff',
                emoji: skill?.icon || weapon.projectile || '•',
                life: 60,
                isDead: false,
                isMagic: isMagic,
                skillId: skill?.id,
                weaponType: p.currentWeapon
            });
        } else {
            const hitbox: Rect = {
                x: p.direction === 1 ? p.x + p.width : p.x - range,
                y: p.y,
                width: range,
                height: p.height
            };
            
            state.current.enemies.forEach(e => {
                // ADDED Y CHECK HERE for Melee
                if (!e.isDead && checkCollision(hitbox, e) && Math.abs(p.y - e.y) < 50) {
                    damageEnemy(e, p.attack * damageMult);
                }
            });
        }
    };

    const damageEnemy = (enemy: Enemy, damage: number) => {
        const finalDamage = Math.floor(damage);
        enemy.hp -= finalDamage;
        enemy.freezeTimer = 5; 
        
        spawnDamageNumber(enemy.x, enemy.y, finalDamage.toString(), '#ffaa00');
        SoundService.playEnemyHit();
        
        // Hit Effect
        state.current.particles.push({
            id: Math.random().toString(),
            x: enemy.x + enemy.width/2, y: enemy.y + enemy.height/2,
            text: '', color: 'white', life: 10, maxLife: 10, vx: 0, vy: 0,
            shape: 'ring', scale: 0.5
        });

        if (enemy.hp <= 0 && !enemy.isDead) {
            enemy.isDead = true;
            enemy.deathTimer = 30; 
            
            const p = state.current.player;
            p.exp += enemy.expValue;
            onEventLog(`+${enemy.expValue} EXP`);
            
            const currentQuest = currentQuestRef.current;
            if (currentQuest && currentQuest.targetMonster === enemy.type && !currentQuest.isCompleted) {
                // Increased drop rate to 90%
                if (Math.random() < 0.9) {
                    const dropData = ENEMY_TYPES[enemy.type as keyof typeof ENEMY_TYPES];
                    state.current.items.push({
                        id: Math.random().toString(),
                        type: 'QuestItem',
                        x: enemy.x, y: enemy.y, width: 30, height: 30,
                        vx: (Math.random() - 0.5) * 5, vy: -6,
                        value: 1,
                        emoji: dropData ? dropData.dropEmoji : '📦',
                        questItemName: dropData ? dropData.dropName : '퀘스트 아이템',
                        life: 1200 
                    });
                }
            }

            if (p.exp >= p.maxExp) {
                p.level++;
                p.exp -= p.maxExp;
                p.maxExp = LEVELS_EXP[p.level] || p.maxExp * 1.2;
                p.sp += 3;
                p.maxHp += 50;
                p.maxMp += 30;
                p.hp = p.maxHp;
                p.mp = p.maxMp;
                SoundService.playLevelUp();
                spawnDamageNumber(p.x, p.y - 40, "LEVEL UP!", "#ffff00", -2);
                
                // Level Up Ring Effect
                state.current.particles.push({
                    id: Math.random().toString(),
                    x: p.x + p.width/2, y: p.y + p.height,
                    text: '', color: 'gold', life: 60, maxLife: 60, vx: 0, vy: -2,
                    shape: 'pillar', width: 60, height: 120
                });
                
                onEventLog(`레벨 업! Lv.${p.level}`);
            }

            // Increased gold drop rate to 80%
            if (Math.random() < 0.8) {
                 state.current.items.push({
                     id: Math.random().toString(),
                     type: 'Gold',
                     x: enemy.x, y: enemy.y, width: 20, height: 20,
                     vx: (Math.random() - 0.5) * 5, vy: -5,
                     value: Math.floor(enemy.expValue * (0.5 + Math.random())),
                     emoji: '💰', life: 400
                 });
            }
        }
    };

    const spawnDamageNumber = (x: number, y: number, text: string, color: string, vy: number = -3) => {
        damageNumbers.current.push({ x, y, text, life: 60, color, vy });
    };

    const checkCollision = (r1: Rect, r2: Rect) => {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    };

    // --- Imperative Handle ---
    useImperativeHandle(ref, () => ({
        purchasePotion: (type) => {
            const p = state.current.player;
            if (p.gold >= UPGRADE_COSTS.POTION) {
                p.gold -= UPGRADE_COSTS.POTION;
                if (type === 'HP') p.hpPotions++;
                else p.mpPotions++;
                SoundService.playCoin();
                return true;
            }
            return false;
        },
        upgradeStat: (type, cost) => {
            const p = state.current.player;
            if (p.gold >= cost) {
                p.gold -= cost;
                if (type === 'ATK') p.attack += 5;
                if (type === 'HP') { p.maxHp += 50; p.hp = p.maxHp; }
                if (type === 'MP') { p.maxMp += 30; p.mp = p.maxMp; }
                SoundService.playLevelUp();
                return true;
            }
            return false;
        },
        switchWeapon: (weapon) => {
             switchWeapon(weapon);
        },
        upgradeSkill: (skillId) => {
             const p = state.current.player;
             const skill = SKILL_TREE.find(s => s.id === skillId);
             if (p.sp > 0 && skill) {
                 const current = p.skills[skillId] || 0;
                 if (current < skill.maxLevel) {
                     p.skills[skillId] = current + 1;
                     p.sp--;
                     SoundService.playCoin(); 
                 }
             }
        },
        assignSkillSlot: (skillId, slotKey) => {
             const p = state.current.player;
             if (p.skillSlots[slotKey] === skillId) {
                 delete p.skillSlots[slotKey];
                 return 'removed';
             } else {
                 p.skillSlots[slotKey] = skillId;
                 return 'assigned';
             }
        },
        jobAdvance: () => {
             const p = state.current.player;
             if (p.level >= 30 && !p.isAdvanced && ADVANCED_CLASS_NAMES[p.classType]) {
                 p.isAdvanced = true;
                 p.name = ADVANCED_CLASS_NAMES[p.classType];
                 p.attack += 20;
                 p.maxHp += 200;
                 p.hp = p.maxHp;
                 
                 const advancedWeapon = CLASS_INFOS[p.classType].weapon; 
                 let newWeapon: WeaponType = 'Sword';
                 if (p.classType === 'Warrior') newWeapon = 'Greatsword';
                 if (p.classType === 'Lancer') newWeapon = 'Polearm';
                 if (p.classType === 'Archer') newWeapon = 'Crossbow';
                 if (p.classType === 'Gunner') newWeapon = 'Cannon';
                 if (p.classType === 'Mage') newWeapon = 'Staff';
                 
                 p.unlockedWeapons.push(newWeapon);
                 p.currentWeapon = newWeapon;
                 
                 SoundService.playLevelUp();
                 onEventLog(`전직 완료! ${p.name}`);
             }
        },
        unlockAllSkills: () => {
             const p = state.current.player;
             SKILL_TREE.forEach(s => {
                 if (s.classType === 'All' || s.classType === p.classType) {
                     p.skills[s.id] = s.maxLevel;
                 }
             });
             p.unlockedWeapons = Object.keys(WEAPONS) as WeaponType[];
        }
    }));

    // --- GAME LOOP ---
    const gameLoop = (time: number) => {
        if (!state.current.player) return; 
        
        if (lastTime.current === 0) lastTime.current = time;
        const delta = time - lastTime.current;
        const dt = Math.min(delta / 16.67, 2); 
        lastTime.current = time;

        // Use ref for gameActive to prevent stale closure
        if (gameActiveRef.current) update(dt);
        draw();

        const boss = state.current.enemies.find(e => e.isBoss) || null;
        onStatsUpdate(state.current.player, boss, state.current.stageLevel, BIOMES[state.current.biomeIndex].name);

        requestRef.current = requestAnimationFrame(gameLoop);
    };

    const update = (dt: number) => {
        const p = state.current.player;
        const currentKeys = keyBindingsRef.current; // Use ref for keys
        const currentQuest = currentQuestRef.current;
        
        // --- Player Physics ---
        if (!p.isDead) {
            // Movement
            if (keysPressed.current.has(currentKeys.LEFT)) {
                p.vx = -MOVE_SPEED * (p.buffs['Haste'] ? 1.4 : 1);
                p.direction = -1;
            } else if (keysPressed.current.has(currentKeys.RIGHT)) {
                p.vx = MOVE_SPEED * (p.buffs['Haste'] ? 1.4 : 1);
                p.direction = 1;
            } else {
                p.vx *= FRICTION;
                if (Math.abs(p.vx) < 0.1) p.vx = 0;
            }

            // Jump
            if (keysPressed.current.has(currentKeys.JUMP)) {
                // Ground check
                let canJump = p.y + p.height >= GROUND_Y;
                if (!canJump) {
                     state.current.platforms.forEach(plat => {
                         if (p.x + p.width > plat.x && p.x < plat.x + plat.width && Math.abs((p.y + p.height) - plat.y) < 5) {
                             canJump = true;
                         }
                     });
                }

                if (canJump && p.vy >= 0) {
                    p.vy = JUMP_FORCE;
                    p.jumps = 1;
                    SoundService.playJump();
                    keysPressed.current.delete(currentKeys.JUMP); 
                } else if (p.jumps < p.maxJumps + (p.skills['DoubleJump'] ? 1 : 0) && !keysPressed.current.has('jumpHeld')) {
                    p.vy = JUMP_FORCE * 0.8;
                    p.jumps++;
                    SoundService.playJump();
                    state.current.particles.push({
                        id: Math.random().toString(),
                        x: p.x, y: p.y + p.height,
                        text: '💨', color: 'white', life: 20, maxLife: 20, vx: -p.direction*2, vy: 0, shape: 'text'
                    });
                    keysPressed.current.delete(currentKeys.JUMP);
                }
            }

            // Attack Logic
            if (keysPressed.current.has(currentKeys.ATTACK) && p.attackCooldown <= 0) {
                performAttack();
            }
            if (p.attackCooldown > 0) p.attackCooldown -= dt;
            
            // Skill Cooldowns Tick
            Object.keys(p.cooldowns).forEach(k => {
                if (p.cooldowns[k] > 0) p.cooldowns[k] -= dt;
            });
            
            p.isAttacking = p.attackCooldown > 10;

            // Gravity
            p.vy += GRAVITY * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // --- Collisions ---
            // Ground
            if (p.y + p.height > GROUND_Y) {
                p.y = GROUND_Y - p.height;
                p.vy = 0;
            }

            // Platforms
            if (p.vy >= 0) { 
                state.current.platforms.forEach(plat => {
                    if (
                        p.x + p.width > plat.x + 10 && 
                        p.x < plat.x + plat.width - 10 &&
                        p.y + p.height >= plat.y &&
                        p.y + p.height <= plat.y + 20 
                    ) {
                        p.y = plat.y - p.height;
                        p.vy = 0;
                    }
                });
            }

            // World Bounds
            if (p.x < 0) p.x = 0;

            // Buffs
            Object.keys(p.buffs).forEach(k => {
                if (p.buffs[k] > 0) p.buffs[k] -= dt;
                else delete p.buffs[k];
            });

            // Invincibility
            if (p.invincibilityTimer > 0) p.invincibilityTimer -= dt;
            
            // Mana Regen
            if (p.mp < p.maxMp) p.mp += 0.05 * dt + (p.skills['MPRestore'] || 0) * 0.01;
        }

        // --- Camera ---
        const targetCamX = p.x - VIEWPORT_WIDTH / 2 + p.width / 2;
        const clampedCamX = Math.max(0, Math.min(state.current.worldWidth - VIEWPORT_WIDTH, targetCamX));
        state.current.cameraX += (clampedCamX - state.current.cameraX) * 0.1;
        
        // Shake
        if (state.current.shakeTimer > 0) {
            state.current.shakeTimer -= dt;
            state.current.cameraX += (Math.random() - 0.5) * 10;
        }

        // --- Projectiles ---
        state.current.projectiles.forEach(proj => {
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            proj.life -= dt;
            if (proj.life <= 0) proj.isDead = true;

            // Collision
            if (proj.isEnemy) {
                // Hit Player
                if (!p.isDead && p.invincibilityTimer <= 0 && checkCollision(proj, p)) {
                    const dmg = Math.max(1, Math.floor(proj.damage * (1 - (p.skills['Achilles']||0)*0.02)));
                    p.hp -= dmg;
                    p.invincibilityTimer = 60;
                    spawnDamageNumber(p.x, p.y, `-${dmg}`, 'red');
                    SoundService.playHit();
                    proj.isDead = true;
                    if (p.hp <= 0) { p.isDead = true; onGameOver(); }
                }
            } else {
                // Hit Enemy
                state.current.enemies.forEach(e => {
                    if (!e.isDead && !proj.isDead && checkCollision(proj, e)) {
                        damageEnemy(e, proj.damage);
                        if (!proj.piercing) proj.isDead = true;
                    }
                });
            }
        });
        state.current.projectiles = state.current.projectiles.filter(p => !p.isDead);

        // --- Enemies ---
        spawnTimer.current -= dt;
        if (spawnTimer.current <= 0 && state.current.enemies.length < 6 + state.current.stageLevel) {
            spawnEnemy();
            spawnTimer.current = 80; 
        }

        state.current.enemies.forEach(e => {
            if (e.isDead) {
                if (e.deathTimer && e.deathTimer > 0) e.deathTimer -= dt;
                return;
            }
            
            if (e.freezeTimer > 0) {
                e.freezeTimer -= dt;
            } else {
                // AI
                const dist = p.x - e.x;
                if (Math.abs(dist) < 800) { 
                     e.vx = (dist > 0 ? 1 : -1) * (e.entitySpeed || 1); 
                     e.direction = dist > 0 ? 1 : -1;
                     
                     // Attack
                     if (e.attackTimer > 0) e.attackTimer -= dt;
                     else if (Math.abs(dist) < (e.isRanged ? 400 : 50)) {
                         e.attackTimer = 120;
                         if (e.isRanged) {
                              state.current.projectiles.push({
                                  id: Math.random().toString(),
                                  x: e.x + (e.direction===1 ? e.width : 0),
                                  y: e.y + e.height/2,
                                  width: 15, height: 15,
                                  vx: e.direction * 5, vy: 0,
                                  damage: e.damage,
                                  color: 'red',
                                  emoji: '🦴',
                                  life: 100, isDead: false, isEnemy: true
                              });
                         } else {
                              // MELEE ATTACK CHECK - Added Y check to prevent hitting from below
                              if (!p.isDead && p.invincibilityTimer <= 0 && Math.abs(p.y - e.y) < 50) {
                                  const dmg = Math.max(1, Math.floor(e.damage * (1 - (p.skills['Achilles']||0)*0.02)));
                                  p.hp -= dmg;
                                  p.invincibilityTimer = 60;
                                  p.vx = e.direction * 10; 
                                  p.vy = -5;
                                  spawnDamageNumber(p.x, p.y, `-${dmg}`, 'red');
                                  SoundService.playHit();
                                  if (p.hp <= 0) { p.isDead = true; onGameOver(); }
                              }
                         }
                     }
                } else {
                    e.vx = 0;
                }
                
                e.x += e.vx * dt;
                
                // Enemy Physics
                let enemyOnGround = false;
                if (e.y + e.height >= GROUND_Y) {
                    e.y = GROUND_Y - e.height;
                    e.vy = 0;
                    enemyOnGround = true;
                } else {
                    // Enemy Platform Collision
                    state.current.platforms.forEach(plat => {
                        if (e.vy >= 0 && e.x + e.width > plat.x && e.x < plat.x + plat.width && e.y + e.height >= plat.y && e.y + e.height <= plat.y + 20) {
                            e.y = plat.y - e.height;
                            e.vy = 0;
                            enemyOnGround = true;
                        }
                    });
                }
                
                if (!enemyOnGround) e.vy += GRAVITY * dt;
                e.y += e.vy * dt;
            }
        });
        state.current.enemies = state.current.enemies.filter(e => !e.isDead || (e.deathTimer && e.deathTimer > 0));

        // --- Items ---
        state.current.items.forEach(item => {
            // Magnet / Auto-collect logic
            if (!p.isDead && item.life > 0) {
                const dx = p.x - item.x;
                const dy = (p.y + p.height/2) - item.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // Strong magnet effect if close or if it's been alive for a bit
                if (dist < 400) {
                    item.vx += (dx / dist) * 2; 
                    item.vy += (dy / dist) * 2;
                }
            }

            item.vy += GRAVITY * dt;
            item.x += item.vx * dt;
            item.y += item.vy * dt;
            
            if (item.y + item.height > GROUND_Y) {
                item.y = GROUND_Y - item.height;
                item.vy *= -0.5; 
                item.vx *= 0.9;
            }
            // Platform bounce for items
            state.current.platforms.forEach(plat => {
                if (item.vy >= 0 && item.x + item.width > plat.x && item.x < plat.x + plat.width && item.y + item.height >= plat.y && item.y + item.height <= plat.y + 20) {
                    item.y = plat.y - item.height;
                    item.vy *= -0.5;
                    item.vx *= 0.9;
                }
            });

            // Pickup
            if (checkCollision(item, p)) {
                if (item.type === 'Gold') {
                    p.gold += item.value;
                    SoundService.playCoin();
                    spawnDamageNumber(p.x, p.y - 40, `+${item.value} G`, 'yellow');
                } else if (item.type === 'QuestItem') {
                    if (currentQuest && !currentQuest.isCompleted) {
                        const newCount = currentQuest.currentCount + 1;
                        onQuestUpdate(newCount);
                        SoundService.playCoin(); 
                        spawnDamageNumber(p.x, p.y - 60, `${item.questItemName || 'Item'}!`, 'cyan', -2);
                        onEventLog(`${item.questItemName} 획득! (${newCount}/${currentQuest.targetCount})`);
                        
                        if (newCount >= currentQuest.targetCount) {
                            onQuestComplete(currentQuest.rewardExp, 0);
                        }
                    }
                }
                item.life = 0; 
            }
            item.life -= dt;
        });
        state.current.items = state.current.items.filter(i => i.life > 0);

        // --- Stage Progression ---
        if (p.x > state.current.worldWidth - 50) {
            // Next Stage
            state.current.stageLevel++;
            p.maxStageReached = Math.max(p.maxStageReached, state.current.stageLevel);
            p.x = 100;
            state.current.cameraX = 0;
            
            // New Platforms
            state.current.worldWidth = 3000 + (state.current.stageLevel * 200);
            state.current.platforms = generatePlatforms(state.current.worldWidth);
            
            // Biome Check
            const currentStage = state.current.stageLevel;
            let newBiomeIndex = BIOMES.findIndex(b => currentStage >= b.startStage && currentStage <= b.endStage);
            if (newBiomeIndex === -1) newBiomeIndex = BIOMES.length - 1;
            state.current.biomeIndex = newBiomeIndex;
            
            onEventLog(`Stage ${state.current.stageLevel}: ${BIOMES[newBiomeIndex].name}`);
            state.current.enemies = []; // Clear enemies
            state.current.items = []; // Clear items
        }
    };

    const spawnEnemy = () => {
        const biome = BIOMES[state.current.biomeIndex];
        
        // Pick enemy based on biome
        const enemyKeys = Object.keys(ENEMY_TYPES);
        const biomeEnemies = enemyKeys.slice(state.current.biomeIndex * 4, (state.current.biomeIndex + 1) * 4);
        if (biomeEnemies.length === 0) return;
        
        const typeKey = biomeEnemies[Math.floor(Math.random() * biomeEnemies.length)];
        const stats = ENEMY_TYPES[typeKey as keyof typeof ENEMY_TYPES];
        
        // Spawn right side of screen relative to player + offset
        const spawnX = Math.min(state.current.worldWidth - 100, state.current.cameraX + VIEWPORT_WIDTH + 100 + Math.random() * 400);
        
        state.current.enemies.push({
            id: Math.random().toString(),
            x: spawnX, y: GROUND_Y - stats.height,
            width: stats.width, height: stats.height,
            vx: 0, vy: 0,
            hp: stats.hp * (1 + state.current.stageLevel * 0.2),
            maxHp: stats.hp * (1 + state.current.stageLevel * 0.2),
            damage: stats.damage * (1 + state.current.stageLevel * 0.1),
            expValue: stats.exp * (1 + state.current.stageLevel * 0.1),
            type: typeKey,
            patrolStart: spawnX - 200, patrolEnd: spawnX + 200,
            attackTimer: 0, isBoss: false,
            freezeTimer: 0, stunTimer: 0,
            isRanged: stats.isRanged || false,
            color: 'red', emoji: stats.emoji, direction: -1, isDead: false,
            entitySpeed: stats.speed 
        } as any);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const p = state.current.player;
        const camX = state.current.cameraX;
        const biome = BIOMES[state.current.biomeIndex];

        // 1. Clear & Background
        const gradient = ctx.createLinearGradient(0, 0, 0, VIEWPORT_HEIGHT);
        gradient.addColorStop(0, biome.sky[0]);
        gradient.addColorStop(1, biome.sky[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
        
        // 2. World Objects (Platforms)
        ctx.save();
        ctx.translate(-camX, 0);
        
        // Stage End Portal
        ctx.font = '60px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('🚪', state.current.worldWidth - 30, GROUND_Y);
        
        // Platforms
        state.current.platforms.forEach(plat => {
            // Ground Top Layer
            ctx.fillStyle = biome.top;
            ctx.fillRect(plat.x, plat.y, plat.width, 10);
            // Ground Body
            ctx.fillStyle = biome.ground;
            ctx.fillRect(plat.x, plat.y + 10, plat.width, plat.height - 10);
        });
        
        // 3. Entities
        
        // Enemies
        state.current.enemies.forEach(e => {
            ctx.save();
            ctx.translate(e.x + e.width/2, e.y + e.height/2);
            ctx.scale(e.direction === 1 ? -1 : 1, 1);
            if (e.isDead) ctx.globalAlpha = (e.deathTimer || 0) / 30;
            
            ctx.font = '40px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.emoji, 0, 0);
            
            ctx.restore();

            // HP Bar (World Space)
            if (!e.isDead) {
                 ctx.fillStyle = 'red';
                 ctx.fillRect(e.x, e.y - 10, e.width, 5);
                 ctx.fillStyle = 'green';
                 ctx.fillRect(e.x, e.y - 10, e.width * (e.hp / e.maxHp), 5);
            }
        });

        // Player (Full Body Rendering)
        if (!p.isDead) {
            ctx.save();
            // Move pivot to center bottom of the player hitbox for better standing
            ctx.translate(p.x + p.width/2, p.y + p.height - 10); 
            ctx.scale(p.direction === 1 ? -1 : 1, 1); // Face direction
            if (p.invincibilityTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) ctx.globalAlpha = 0.5;

            // --- ANIMATION CALCS ---
            const time = Date.now();
            const isMoving = Math.abs(p.vx) > 0.1;
            const isJumping = Math.abs(p.vy) > 0.1;
            
            // Walk cycle: sine wave for legs
            const walkCycle = isMoving && !isJumping ? Math.sin(time / 100) : 0;
            const legOffset = walkCycle * 8;
            
            // Bobbing body
            const bodyBob = isMoving && !isJumping ? Math.abs(Math.sin(time / 50)) * 2 : 0;

            // Class Colors
            const bodyColors: Record<string, string> = {
                Warrior: '#8B0000', // Dark Red
                Lancer: '#4B0082',  // Indigo
                Archer: '#228B22',  // Forest Green
                Gunner: '#555555',  // Grey
                Mage: '#00008B'     // Dark Blue
            };
            const bodyColor = bodyColors[p.classType] || '#333';
            
            // --- DRAW LEGS ---
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#222';

            // Back Leg
            ctx.beginPath();
            ctx.moveTo(-5, -15);
            ctx.lineTo(-5 - legOffset, 5); // Foot position
            ctx.stroke();

            // Front Leg
            ctx.beginPath();
            ctx.moveTo(5, -15);
            ctx.lineTo(5 + legOffset, 5);
            ctx.stroke();

            // --- DRAW BODY ---
            // Tunic/Armor
            ctx.fillStyle = bodyColor;
            // Simple rounded rect for body
            ctx.beginPath();
            ctx.roundRect(-12, -35 - bodyBob, 24, 25, 4);
            ctx.fill();
            
            // Belt/Detail
            ctx.fillStyle = '#111';
            ctx.fillRect(-12, -15 - bodyBob, 24, 4);

            // --- DRAW HEAD (EMOJI) ---
            ctx.font = '35px serif'; // Smaller head for better proportions
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Adjusted Y offset for smaller head and slight bob
            ctx.fillText(p.emoji, 0, -50 - bodyBob);

            // --- DRAW WEAPON (In Hand) ---
            const weapon = WEAPONS[p.currentWeapon];
            if (weapon) {
                ctx.save();
                // Hand position (front arm)
                const handX = 8;
                const handY = -25 - bodyBob;
                
                ctx.translate(handX, handY);
                
                let rotation = 0;
                if (p.isAttacking) {
                     if (weapon.type === 'melee') rotation = -100 * Math.PI / 180; // Swing
                     else rotation = -10 * Math.PI / 180; // Recoil
                } else {
                     if (weapon.type === 'melee') rotation = -45 * Math.PI / 180; // Idle hold
                     else rotation = 0; // Aim
                }
                
                ctx.rotate(rotation);
                
                ctx.font = '24px serif';
                if (weapon.type === 'ranged') {
                     if (p.currentWeapon === 'Gun') {
                         ctx.save();
                         ctx.scale(-1, 1); // Flip gun sprite
                         ctx.fillText(weapon.emoji, -10, 0); 
                         ctx.restore();
                     } else {
                         ctx.fillText(weapon.emoji, 5, 0); 
                     }
                } else {
                     // Melee held by handle
                     ctx.fillText(weapon.emoji, 0, -10); 
                }
                
                // Draw Hand (Circle)
                ctx.fillStyle = '#FFDAB9'; // Peach skin tone
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }

            // Name Tag
            ctx.scale(p.direction === 1 ? -1 : 1, 1); // Flip back for text
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillText(p.name, 0, -85 - bodyBob);
            ctx.shadowBlur = 0;

            ctx.restore();
        }

        // Projectiles
        state.current.projectiles.forEach(proj => {
            ctx.save();
            ctx.translate(proj.x + proj.width/2, proj.y + proj.height/2);
            if (proj.vx < 0) ctx.scale(-1, 1);
            ctx.font = '20px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(proj.emoji, 0, 0);
            ctx.restore();
        });

        // Items
        state.current.items.forEach(item => {
            ctx.save();
            ctx.translate(item.x + item.width/2, item.y + item.height/2);
            ctx.font = '20px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.emoji, 0, Math.sin(Date.now()/200)*5); // Float
            ctx.restore();
        });
        
        // Particles & Visual Effects
        state.current.particles.forEach(pt => {
             ctx.save();
             ctx.translate(pt.x, pt.y);
             
             // Opacity based on life
             ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);

             if (pt.shape === 'slash') {
                 // Draw Slash Wave
                 ctx.rotate((pt.rotation || 0) * Math.PI / 180);
                 ctx.fillStyle = pt.color;
                 const w = pt.width || 50;
                 const h = pt.height || 50;
                 
                 ctx.beginPath();
                 ctx.moveTo(0, 0);
                 ctx.quadraticCurveTo(w/2, -h/2, w, 0);
                 ctx.quadraticCurveTo(w/2, -h/4, 0, 0);
                 ctx.fill();
                 
                 // Glow
                 ctx.shadowBlur = 10;
                 ctx.shadowColor = pt.color;
                 ctx.fill();
                 ctx.shadowBlur = 0;

             } else if (pt.shape === 'ring') {
                 // Expanding Ring
                 const radius = (pt.width || 50) * (1 + (pt.maxLife - pt.life) / 10);
                 ctx.strokeStyle = pt.color;
                 ctx.lineWidth = 3;
                 ctx.beginPath();
                 ctx.arc(0, 0, radius, 0, Math.PI * 2);
                 ctx.stroke();

             } else if (pt.shape === 'lightning') {
                 // Lightning Bolt
                 const tx = (pt.targetX || 0) - pt.x;
                 const ty = (pt.targetY || 0) - pt.y;
                 const dist = Math.sqrt(tx*tx + ty*ty);
                 const segments = 5;
                 
                 ctx.strokeStyle = pt.color;
                 ctx.lineWidth = 2;
                 ctx.shadowBlur = 5;
                 ctx.shadowColor = pt.color;
                 
                 ctx.beginPath();
                 ctx.moveTo(0,0);
                 
                 let currX = 0;
                 let currY = 0;
                 
                 for(let i=1; i<segments; i++) {
                     const ratio = i/segments;
                     // Add jitter
                     const jitter = (Math.random() - 0.5) * 30;
                     const nextX = tx * ratio + jitter;
                     const nextY = ty * ratio + jitter;
                     ctx.lineTo(nextX, nextY);
                     currX = nextX;
                     currY = nextY;
                 }
                 ctx.lineTo(tx, ty);
                 ctx.stroke();
                 ctx.shadowBlur = 0;

             } else if (pt.shape === 'pillar') {
                 // Rising Light Pillar (Ice/Holy)
                 const w = pt.width || 40;
                 const h = (pt.height || 100) * Math.min(1, (pt.maxLife - pt.life)/5); // Grow up
                 
                 ctx.fillStyle = pt.color;
                 ctx.globalAlpha = Math.min(1, pt.life/10) * 0.5; // Fade in/out logic
                 
                 ctx.fillRect(-w/2, -h, w, h);
                 
                 // Core
                 ctx.fillStyle = '#fff';
                 ctx.globalAlpha = Math.min(1, pt.life/10) * 0.8;
                 ctx.fillRect(-w/4, -h, w/2, h);

             } else {
                 // Default Text Particle
                 ctx.fillStyle = pt.color;
                 ctx.font = '15px serif';
                 ctx.fillText(pt.text, 0, 0);
             }

             ctx.restore();
             
             // Physics update for particles
             pt.x += pt.vx;
             pt.y += pt.vy;
             pt.life--;
        });
        state.current.particles = state.current.particles.filter(p => p.life > 0);

        // Damage Numbers (Text) - Rendered on top
        damageNumbers.current.forEach(dn => {
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = dn.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.strokeText(dn.text, dn.x, dn.y);
            ctx.fillText(dn.text, dn.x, dn.y);
            dn.y += dn.vy;
            dn.life--;
        });
        damageNumbers.current = damageNumbers.current.filter(dn => dn.life > 0);

        ctx.restore();
    };

    return <canvas ref={canvasRef} width={VIEWPORT_WIDTH} height={VIEWPORT_HEIGHT} className="w-full h-full object-contain" />;
});

export default GameCanvas;
