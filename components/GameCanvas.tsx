import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
    Player, Enemy, Projectile, GameState, Item, 
    Direction, Quest, Rect, WeaponType, KeyBindings, ClassType
} from '../types';
import { 
    GRAVITY, FRICTION, MOVE_SPEED, JUMP_FORCE, GROUND_Y, 
    VIEWPORT_WIDTH, VIEWPORT_HEIGHT, BIOMES, ENEMY_TYPES, 
    WEAPONS, LEVELS_EXP, PLAYER_WIDTH, PLAYER_HEIGHT, UPGRADE_COSTS,
    SKILL_TREE, CLASS_INFOS, ADVANCED_CLASS_NAMES
} from '../constants';
import { SoundService } from '../services/soundService';
import { generateChat } from '../services/geminiService';

export interface GameCanvasHandle {
    purchasePotion: (type: 'HP' | 'MP') => boolean;
    upgradeStat: (stat: 'ATK' | 'HP' | 'MP', cost: number) => boolean;
    switchWeapon: (weapon: WeaponType) => void;
    assignSkillSlot: (skillId: string, slotKey: string) => string; 
    upgradeSkill: (skillId: string) => boolean;
    getSnapshot: () => string;
    jobAdvance: () => boolean; 
    unlockAllSkills: () => void;
}

interface GameCanvasProps {
    onStatsUpdate: (player: Player, boss: Enemy | null, stageLevel: number, biomeName: string) => void;
    onEventLog: (msg: string) => void;
    onGameOver: () => void;
    onQuestUpdate: (newCount: number) => void;
    onQuestComplete: (rewardExp: number, rewardGold: number) => void;
    gameActive: boolean;
    currentQuest: Quest | null;
    keyBindings: KeyBindings;
    backgroundImage?: string | null;
    initialClass?: ClassType;
}

const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({ 
    onStatsUpdate, onEventLog, onGameOver, onQuestUpdate, onQuestComplete, gameActive, currentQuest, keyBindings, backgroundImage, initialClass
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const keysPressed = useRef<Set<string>>(new Set());
    const mouseRef = useRef<{x: number, y: number}>({ x: 0, y: 0 });
    
    // Background Image Handling
    const bgImageRef = useRef<HTMLImageElement | null>(null);
    useEffect(() => {
        if (backgroundImage) {
            const img = new Image();
            img.src = backgroundImage;
            img.onload = () => { bgImageRef.current = img; };
        } else {
            bgImageRef.current = null;
        }
    }, [backgroundImage]);
    
    const latestProps = useRef({ currentQuest, onQuestUpdate, onQuestComplete, onEventLog, onGameOver, keyBindings, onStatsUpdate });
    useEffect(() => {
        latestProps.current = { currentQuest, onQuestUpdate, onQuestComplete, onEventLog, onGameOver, keyBindings, onStatsUpdate };
    }, [currentQuest, onQuestUpdate, onQuestComplete, onEventLog, onGameOver, keyBindings, onStatsUpdate]);

    // Game State
    const gameState = useRef<GameState>({
        player: {
            id: 'player',
            x: 100,
            y: GROUND_Y - PLAYER_HEIGHT,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            vx: 0,
            vy: 0,
            color: 'blue',
            emoji: '🧙‍♂️',
            direction: Direction.RIGHT,
            isDead: false,
            hp: 100,
            maxHp: 100,
            mp: 100,
            maxMp: 100,
            shield: 0,
            level: 1,
            exp: 0,
            maxExp: 100,
            attack: 10,
            name: '용사',
            isAttacking: false,
            isDownAttacking: false, 
            attackCooldown: 0,
            maxAttackCooldown: 20,
            classType: 'Warrior', // Default
            isAdvanced: false,
            currentWeapon: 'Sword',
            unlockedWeapons: ['Sword'],
            weaponRotation: 0,
            invincibilityTimer: 0,
            gold: 0,
            hpPotions: 3,
            mpPotions: 3,
            maxStageReached: 1,
            sp: 0,
            skills: {},
            skillSlots: {},
            cooldowns: {},
            jumps: 0,
            maxJumps: 1,
            buffs: {}
        },
        enemies: [],
        particles: [],
        projectiles: [],
        platforms: [],
        items: [],
        lightnings: [],
        cameraX: 0,
        worldWidth: 2000,
        stageLevel: 1,
        shakeTimer: 0,
        biomeIndex: 0
    });

    // Helper to force update UI even when game loop is paused (e.g. inside a modal)
    const forceUIUpdate = () => {
        const s = gameState.current;
        const biome = BIOMES[s.biomeIndex];
        const boss = s.enemies.find(e => e.isBoss) || null;
        latestProps.current.onStatsUpdate({ ...s.player }, boss, s.stageLevel, biome.name);
    };

    // --- LOAD STAGE FUNCTION ---
    const loadStage = (level: number) => {
        const state = gameState.current;
        state.stageLevel = level;
        
        let bIndex = BIOMES.findIndex(b => level >= b.startStage && level <= b.endStage);
        if (bIndex === -1) bIndex = BIOMES.length - 1;
        state.biomeIndex = bIndex;

        state.enemies = [];
        state.projectiles = [];
        state.particles = [];
        state.items = [];
        state.platforms = [];
        state.lightnings = [];
        
        state.player.x = 100;
        state.player.y = GROUND_Y - PLAYER_HEIGHT;
        state.player.vx = 0;
        state.player.vy = 0;
        state.cameraX = 0;

        // Ground
        state.platforms.push({ x: -1000, y: GROUND_Y, width: state.worldWidth + 2000, height: 200 });

        // Platforms
        const platCount = 5 + Math.floor(Math.random() * 5);
        for(let i=0; i<platCount; i++) {
            const w = 150 + Math.random() * 200;
            const x = 300 + Math.random() * (state.worldWidth - 600);
            const y = GROUND_Y - 100 - Math.random() * 250;
            state.platforms.push({ x, y, width: w, height: 20 });
        }

        // Mobs
        const biomeMobs = [
             ['Snail', 'Slime', 'Mushroom', 'Boar'], 
             ['Cactus', 'Scorpion', 'Snake', 'Vulture'], 
             ['Wolf', 'Yeti', 'Penguin', 'IceGolem'], 
             ['Robot', 'Drone', 'Cyborg', 'Alien'], 
             ['Angel', 'Guardian', 'Pegasus', 'CloudSpirit'], 
             ['FireSpirit', 'Dragon', 'Zombie', 'Demon'] 
        ];
        
        const mobs = biomeMobs[state.biomeIndex] || biomeMobs[0];
        const enemyCount = 5 + level; 
        
        for(let i=0; i<enemyCount; i++) {
             const type = mobs[Math.floor(Math.random() * mobs.length)];
             const x = 500 + Math.random() * (state.worldWidth - 600);
             spawnEnemy(x, type as any);
        }

        if (level % 5 === 0) {
             const bossType = mobs[mobs.length - 1]; 
             spawnEnemy(state.worldWidth - 400, bossType as any, true);
        }

        if(latestProps.current) latestProps.current.onEventLog(`스테이지 ${level} 시작!`);
        forceUIUpdate();
    };

    // Init Player Class if provided
    useEffect(() => {
        if (initialClass) {
            // Check if we need to initialize (class changed OR first load/empty platforms)
            if (gameState.current.player.classType !== initialClass || gameState.current.platforms.length === 0) {
                const p = gameState.current.player;
                const info = CLASS_INFOS[initialClass];
                p.classType = initialClass;
                p.currentWeapon = info.weapon;
                p.unlockedWeapons = [info.weapon];
                p.emoji = info.icon;
                // Reset skills
                p.skills = {};
                p.skillSlots = {};
                p.sp = 0;
                p.shield = 0;
                p.buffs = {};
                p.isAdvanced = false;
                // Reset Stage to 1 only on new class selection (Restart)
                loadStage(1);
                forceUIUpdate();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialClass]);

    // Helper to switch weapon (internal)
    const performSwitchWeapon = (weapon: WeaponType) => {
        const player = gameState.current.player;
        if (player.unlockedWeapons.includes(weapon)) {
            player.currentWeapon = weapon;
            latestProps.current.onEventLog(`무기 장착: ${WEAPONS[weapon].emoji} ${weapon}`);
            forceUIUpdate();
        } else {
            latestProps.current.onEventLog('아직 해금되지 않은 무기입니다.');
        }
    };

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        purchasePotion: (type: 'HP' | 'MP') => {
            const s = gameState.current;
            const cost = UPGRADE_COSTS.POTION;
            if (s.player.gold >= cost) {
                s.player.gold -= cost;
                if (type === 'HP') s.player.hpPotions++;
                if (type === 'MP') s.player.mpPotions++;
                SoundService.playCoin();
                createParticle(s.player.x, s.player.y - 50, `+1 ${type} Potion`, type === 'HP' ? 'red' : 'blue');
                forceUIUpdate();
                return true;
            }
            return false;
        },
        upgradeStat: (stat: 'ATK' | 'HP' | 'MP', cost: number) => {
            const s = gameState.current;
            if (s.player.gold >= cost) {
                s.player.gold -= cost;
                if (stat === 'ATK') {
                    s.player.attack += 5;
                    createParticle(s.player.x, s.player.y - 50, "ATK UP!", "orange", 100);
                }
                if (stat === 'HP') {
                    s.player.maxHp += 50;
                    s.player.hp = s.player.maxHp;
                    createParticle(s.player.x, s.player.y - 50, "MAX HP UP!", "red", 100);
                }
                if (stat === 'MP') {
                    s.player.maxMp += 30;
                    s.player.mp = s.player.maxMp;
                    createParticle(s.player.x, s.player.y - 50, "MAX MP UP!", "blue", 100);
                }
                SoundService.playLevelUp();
                forceUIUpdate();
                return true;
            }
            return false;
        },
        switchWeapon: (weapon: WeaponType) => {
            performSwitchWeapon(weapon);
        },
        assignSkillSlot: (skillId: string, slotKey: string) => {
            const slots = gameState.current.player.skillSlots;
            if (slots[slotKey] === skillId) {
                delete slots[slotKey];
                forceUIUpdate();
                return 'removed';
            } else {
                gameState.current.player.skillSlots[slotKey] = skillId;
                forceUIUpdate();
                return 'assigned';
            }
        },
        upgradeSkill: (skillId: string) => {
            const s = gameState.current.player;
            const skillDef = SKILL_TREE.find(skill => skill.id === skillId);
            
            if (!skillDef) return false;
            
            const currentLevel = s.skills[skillId] || 0;

            if (s.sp <= 0) return false;
            if (currentLevel >= skillDef.maxLevel) return false;
            if (s.level < skillDef.reqLevel) return false;
            if (skillDef.reqSkill && (s.skills[skillDef.reqSkill] || 0) < 1) return false; 

            s.sp--;
            s.skills[skillId] = currentLevel + 1;
            
            if (skillId === 'IronBody') {
                s.maxHp += 50;
                s.hp += 50;
            }
            if (skillId === 'Meditation') {
                s.maxMp += 30;
                s.mp += 30;
            }
            if (skillId === 'DoubleJump') {
                s.maxJumps = 2;
            }

            SoundService.playLevelUp();
            createParticle(s.x, s.y - 60, `${skillDef.name} UP!`, '#ffff00', 120);
            
            forceUIUpdate();
            return true;
        },
        jobAdvance: () => {
            const p = gameState.current.player;
            if (p.isAdvanced || p.level < 30) return false;

            p.isAdvanced = true;
            const newName = ADVANCED_CLASS_NAMES[p.classType];
            
            // Grant Unique Weapon
            let newWeapon: WeaponType = 'Sword'; // Fallback
            if (p.classType === 'Warrior') newWeapon = 'Greatsword';
            if (p.classType === 'Lancer') newWeapon = 'Polearm';
            if (p.classType === 'Archer') newWeapon = 'Crossbow';
            if (p.classType === 'Gunner') newWeapon = 'Cannon';
            if (p.classType === 'Mage') newWeapon = 'Staff';

            if (!p.unlockedWeapons.includes(newWeapon)) {
                p.unlockedWeapons.push(newWeapon);
            }
            p.currentWeapon = newWeapon;

            createParticle(p.x, p.y - 80, "JOB ADVANCEMENT!", "#00ffff", 150);
            createParticle(p.x, p.y - 50, `${newName} 전직 완료!`, "#ffffff", 150);
            createParticle(p.x, p.y - 20, `${newWeapon} 획득!`, "#ffff00", 150);
            
            SoundService.playLevelUp();
            latestProps.current.onEventLog(`축하합니다! ${newName}로 전직하였습니다!`);
            forceUIUpdate();
            return true;
        },
        unlockAllSkills: () => {
            const p = gameState.current.player;
            p.level = 50;
            p.maxHp = 5000; p.hp = 5000;
            p.maxMp = 3000; p.mp = 3000;
            p.sp = 100; // Extra SP
            p.gold += 100000;
            p.isAdvanced = true;
            
            // Unlock Class Specific Advanced Weapon
            let newWeapon: WeaponType | null = null;
            if (p.classType === 'Warrior') newWeapon = 'Greatsword';
            if (p.classType === 'Lancer') newWeapon = 'Polearm';
            if (p.classType === 'Archer') newWeapon = 'Crossbow';
            if (p.classType === 'Gunner') newWeapon = 'Cannon';
            if (p.classType === 'Mage') newWeapon = 'Staff';

            if (newWeapon && !p.unlockedWeapons.includes(newWeapon)) {
                p.unlockedWeapons.push(newWeapon);
                p.currentWeapon = newWeapon;
            }

            // Max out all valid skills
            SKILL_TREE.forEach(skill => {
                if (skill.classType === 'All' || skill.classType === p.classType) {
                    p.skills[skill.id] = skill.maxLevel;
                    // Apply immediate passive effects if needed
                    if (skill.id === 'DoubleJump') p.maxJumps = 2;
                }
            });

            createParticle(p.x, p.y - 80, "TEST MODE ACTIVATED!", "#ff00ff", 200, 1.5);
            SoundService.playLevelUp();
            forceUIUpdate();
        },
        getSnapshot: () => {
            if (canvasRef.current) {
                return canvasRef.current.toDataURL('image/png');
            }
            return '';
        }
    }));

    // --- HELPER FUNCTIONS ---
    const checkCollision = (r1: Rect, r2: Rect) => {
        return (
            r1.x < r2.x + r2.width &&
            r1.x + r1.width > r2.x &&
            r1.y < r2.y + r2.height &&
            r1.y + r1.height > r2.y
        );
    };

    const createParticle = (x: number, y: number, text: string, color: string, life = 60, scale = 1) => {
        gameState.current.particles.push({
            id: Math.random().toString(),
            x, y, text, color, life, maxLife: life,
            vx: (Math.random() - 0.5) * 2,
            vy: -2 - Math.random() * 2,
            scale
        });
    };

    const spawnItem = (x: number, y: number, forceType?: 'HpPotion' | 'MpPotion' | 'Gold' | 'Weapon' | 'QuestItem', weaponType?: WeaponType, questItemName?: string, questItemEmoji?: string, customValue?: number) => {
        let type: 'Gold' | 'HpPotion' | 'MpPotion' | 'Weapon' | 'QuestItem' = 'Gold';
        if (forceType) type = forceType;
        else {
            const rand = Math.random();
            if (rand > 0.9) type = 'HpPotion';
            else if (rand > 0.8) type = 'MpPotion';
            else type = 'Gold';
        }

        let emoji = '💰';
        if (type === 'HpPotion') emoji = '🍷';
        if (type === 'MpPotion') emoji = '🧪';
        if (type === 'Weapon') emoji = WEAPONS[weaponType!].emoji;
        if (type === 'QuestItem') emoji = questItemEmoji || '📦';

        let val = 10;
        if (customValue !== undefined) {
            val = customValue;
        } else {
             if (type === 'HpPotion' || type === 'MpPotion' || type === 'QuestItem') val = 1;
             else val = Math.floor(Math.random() * 50) + 10;
        }
        
        // Apply "Greed" Skill
        const greedLevel = gameState.current.player.skills['Greed'] || 0;
        if (type === 'Gold' && greedLevel > 0) {
            val = Math.floor(val * (1 + greedLevel * 0.1));
        }

        const item: Item = {
            id: Math.random().toString(),
            x, y, width: 30, height: 30,
            type, weaponType, questItemName,
            value: val,
            emoji, vx: (Math.random() - 0.5) * 8, vy: -5 - Math.random() * 3, life: 900
        };
        gameState.current.items.push(item);
    };

    const spawnEnemy = (x: number, type: keyof typeof ENEMY_TYPES, isBoss = false) => {
        const config = ENEMY_TYPES[type];
        const scale = isBoss ? 2 : 1;
        
        // Spawn on platform logic
        const spawnOnPlatform = Math.random() < 0.4 && gameState.current.platforms.length > 1;
        let spawnY = GROUND_Y - config.height * scale;
        let spawnX = x;

        if (spawnOnPlatform && !isBoss) {
            const validPlatforms = gameState.current.platforms.slice(1); // Exclude ground (index 0)
            if (validPlatforms.length > 0) {
                const plat = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
                spawnY = plat.y - config.height * scale;
                spawnX = plat.x + Math.random() * plat.width;
            }
        }

        const enemy: Enemy = {
            id: Math.random().toString(36).substr(2, 9),
            x: spawnX, 
            y: spawnY,
            width: config.width * scale,
            height: config.height * scale,
            vx: isBoss ? config.speed * 0.7 : config.speed,
            vy: 0,
            color: 'green',
            emoji: config.emoji,
            direction: Direction.RIGHT,
            isDead: false,
            hp: isBoss ? config.hp * 5 : config.hp,
            maxHp: isBoss ? config.hp * 5 : config.hp,
            damage: isBoss ? config.damage * 1.2 : config.damage,
            expValue: isBoss ? config.exp * 50 : config.exp,
            type: isBoss ? `Giant ${type}` : type,
            patrolStart: x - 300,
            patrolEnd: x + 300,
            attackTimer: 0,
            isBoss: isBoss,
            freezeTimer: 0,
            stunTimer: 0,
            isRanged: config.isRanged || false
        };
        gameState.current.enemies.push(enemy);
    };

    const createLightning = (targetX: number, targetY: number) => {
        const startX = targetX + (Math.random() - 0.5) * 100;
        const startY = -100;
        const points: {x: number, y: number}[] = [];
        const steps = 12;
        points.push({x: startX, y: startY});
        for(let i = 1; i < steps; i++) {
            const t = i / steps;
            const x = startX + (targetX - startX) * t + (Math.random() - 0.5) * 60;
            const y = startY + (targetY - startY) * t;
            points.push({x, y});
        }
        points.push({x: targetX, y: targetY});
        gameState.current.lightnings.push({
            id: Math.random().toString(),
            points: points,
            life: 15, maxLife: 15, color: '#ffffff', width: 3 + Math.random() * 2
        });
    };

    // --- ATTACK FUNCTION ---
    const attemptAttack = () => {
        const state = gameState.current;
        const player = state.player;
        
        if (player.isAttacking || player.attackCooldown > 0) return;
        if (player.isDead) return;

        player.isAttacking = true;
        const weapon = WEAPONS[player.currentWeapon];
        player.attackCooldown = weapon.cooldown;
        player.maxAttackCooldown = weapon.cooldown;

        SoundService.playAttack();
        
        // Check Down Attack Condition: In air + Down Key
        const isDownKeyPressed = keysPressed.current.has(latestProps.current.keyBindings.DOWN);
        const isInAir = player.jumps > 0 || Math.abs(player.vy) > 0.1;
        player.isDownAttacking = isDownKeyPressed && isInAir;

        const isRanged = weapon.type === 'ranged';
        
        if (isRanged) {
             const weaponData = WEAPONS[player.currentWeapon] as any;
             const projectileEmoji = weaponData.projectile || '•';
             
             // Piercing Logic for Crossbow
             const isPiercing = player.currentWeapon === 'Crossbow';
             // AoE/Explosive Logic for Cannon
             const isExplosive = player.currentWeapon === 'Cannon';

             let vx = player.direction * weapon.speed;
             let vy = (Math.random() - 0.5) * 1;
             
             // Downward Ranged Attack
             if (player.isDownAttacking) {
                 vx = 0;
                 vy = weapon.speed * 0.8; // Fire down
             }

             state.projectiles.push({
                id: Math.random().toString(),
                x: player.x + (player.isDownAttacking ? player.width/2 - 10 : (player.direction === 1 ? player.width : 0)),
                y: player.y + (player.isDownAttacking ? player.height : 30),
                width: isExplosive ? 40 : 30, // Increased size
                height: isExplosive ? 40 : 30,
                vx: vx,
                vy: vy,
                damage: player.attack * weapon.damageMult,
                color: 'white',
                emoji: projectileEmoji,
                life: isExplosive ? 100 : 60, 
                isDead: false, 
                isMagic: player.currentWeapon === 'Staff',
                piercing: isPiercing,
                explosive: isExplosive,
                weaponType: player.currentWeapon,
                rotation: player.isDownAttacking ? 90 : undefined
             });
        } else {
             // Melee
             setTimeout(() => {
                 let hitSomething = false;
                 state.enemies.forEach(e => {
                     if (!e.isDead) {
                         let inRange = false;
                         const dist = Math.abs((player.x + player.width/2) - (e.x + e.width/2));
                         
                         if (player.isDownAttacking) {
                             // Downward hitbox: Below player
                             const verticalDist = (e.y) - (player.y + player.height);
                             if (Math.abs((player.x + player.width/2) - (e.x + e.width/2)) < 60 && verticalDist > -50 && verticalDist < weapon.range) {
                                 inRange = true;
                             }
                         } else {
                             // Forward hitbox
                             const facing = (player.direction === 1 && e.x > player.x) || (player.direction === -1 && e.x < player.x);
                             if (dist < weapon.range && facing && Math.abs(player.y - e.y) < 120) {
                                 inRange = true;
                             }
                         }

                         if (inRange) {
                             // Melee Distance Logic (Tip Damage)
                             let damageMod = 1.0;
                             if (player.currentWeapon === 'Spear' || player.currentWeapon === 'Polearm') {
                                 // Tip damage logic doesn't really apply well to down stabs visually, keep it for forward
                                 if (!player.isDownAttacking) {
                                     if (dist > weapon.range * 0.6) damageMod = 1.3;
                                     else damageMod = 0.7; 
                                 }
                             }
                             
                             applyDamage(e, player.attack * weapon.damageMult * damageMod, player.direction, damageMod);
                             hitSomething = true;
                         }
                     }
                 });

                 // Pogo bounce
                 if (player.isDownAttacking && hitSomething) {
                     player.vy = -12; // Bounce up
                     player.jumps = 1; // Reset jump slightly to allow double jump after pogo?
                     createParticle(player.x, player.y + player.height, "BOUNCE!", "#fff", 30);
                 }

             }, 100);
             
             // Visual Slash (Only for non-stabbing weapons or down attack)
             // Stabbing weapons (Spear, Polearm) have their own visual in draw()
             const isStabbingWeapon = player.currentWeapon === 'Spear' || player.currentWeapon === 'Polearm';
             if (!isStabbingWeapon || player.isDownAttacking) {
                 const splashSize = (player.currentWeapon === 'Greatsword') ? 60 : 30;
                 if (player.isDownAttacking) {
                     createParticle(player.x, player.y + player.height, "⏬", "white", 15);
                 } else {
                     createParticle(player.x + (player.direction * splashSize), player.y, "⚔️", "white", 15);
                 }
             }
        }
    };

    // --- POTION FUNCTION ---
    const usePotion = (type: 'HP' | 'MP') => {
        const player = gameState.current.player;
        if (type === 'HP') {
            if (player.hpPotions > 0 && player.hp < player.maxHp) {
                player.hpPotions--;
                player.hp = Math.min(player.maxHp, player.hp + 50);
                SoundService.playDrink();
                createParticle(player.x, player.y - 40, "+50 HP", "red");
                forceUIUpdate();
            } else if(player.hpPotions <= 0) {
                 latestProps.current.onEventLog("HP 물약이 없습니다.");
            }
        } else {
            if (player.mpPotions > 0 && player.mp < player.maxMp) {
                player.mpPotions--;
                player.mp = Math.min(player.maxMp, player.mp + 50);
                SoundService.playDrink();
                createParticle(player.x, player.y - 40, "+50 MP", "blue");
                forceUIUpdate();
            } else if(player.mpPotions <= 0) {
                 latestProps.current.onEventLog("MP 물약이 없습니다.");
            }
        }
    };

    // --- SKILL EXECUTION ---
    const useActiveSkill = (slotKey: string) => {
        const state = gameState.current;
        const player = state.player;
        const skillId = player.skillSlots[slotKey];
        
        if (!skillId) return; 

        const skillDef = SKILL_TREE.find(s => s.id === skillId);
        if (!skillDef || (skillDef.type !== 'active' && skillDef.type !== 'buff')) return;

        const skillLevel = player.skills[skillId] || 0;
        if (skillLevel <= 0) {
            latestProps.current.onEventLog("아직 배우지 않은 스킬입니다.");
            return;
        }

        if (player.cooldowns[skillId] > 0) return;

        if (player.mp < (skillDef.mpCost || 0)) {
            createParticle(player.x, player.y - 40, "No MP!", "#5555ff");
            return;
        }

        player.mp -= (skillDef.mpCost || 0);
        player.cooldowns[skillId] = (skillDef.cooldown || 60);
        
        // Buff Handling
        if (skillDef.type === 'buff') {
            player.buffs[skillId] = (skillDef.duration || 600) + (skillLevel * 120);
            createParticle(player.x, player.y - 50, `${skillDef.name}!`, '#00ffff', 120);
            SoundService.playEquip();
            forceUIUpdate();
            return;
        }

        // Active Skill Logic
        player.isAttacking = true;
        player.attackCooldown = 20; 
        player.maxAttackCooldown = 20;

        // Base damage calculation (affected by Rage buff)
        let buffMultiplier = 1.0;
        if (player.buffs['Rage']) buffMultiplier += 0.5;
        if (player.buffs['DragonBlood']) buffMultiplier += 0.3;
        if (player.buffs['Concentrate']) buffMultiplier += 0.2;
        if (player.buffs['Enrage']) buffMultiplier += 1.0;

        let baseDamage = player.attack * (skillDef.damageMult || 1.0) * buffMultiplier;
        baseDamage *= (1 + skillLevel * 0.1); 

        // --- SKILL EFFECTS ---
        switch(skillId) {
            // ... (Skill logic remains same, can be enhanced for advanced weapons if desired) ...
            // Keeping existing skill logic for brevity, it works with new stats naturally
            // --- WARRIOR ---
            case 'PowerStrike':
            case 'SlashBlast':
            case 'Brandish':
                SoundService.playAttack();
                const hits = skillId === 'Brandish' ? 2 : 1;
                for(let h=0; h<hits; h++) {
                    setTimeout(() => {
                        state.projectiles.push({
                            id: Math.random().toString(),
                            x: player.direction === 1 ? player.x + player.width : player.x - (skillId === 'SlashBlast' ? 100 : 50),
                            y: player.y + player.height / 2,
                            width: skillId === 'SlashBlast' ? 150 : 50, height: 100,
                            vx: player.direction * 2, vy: 0,
                            damage: baseDamage, color: 'white', emoji: skillId === 'SlashBlast' ? '🌪️' : '⚔️',
                            life: 15, isDead: false, isMagic: true, skillId: skillId
                        });
                    }, h * 200);
                }
                break;
            case 'Rush':
                player.vx = player.direction * 20;
                player.invincibilityTimer = 30;
                state.enemies.forEach(e => {
                    if(!e.isDead && Math.abs(e.x - player.x) < 150) {
                        e.vx = player.direction * 15;
                        applyDamage(e, baseDamage, player.direction);
                    }
                });
                break;
            case 'Shout':
            case 'GroundSmash':
                SoundService.playMagicExplosion();
                state.shakeTimer = 10;
                createParticle(player.x, player.y - 20, "STUN!", "yellow", 60);
                state.enemies.forEach(e => {
                    if (!e.isDead && Math.abs(e.x - player.x) < (skillId === 'GroundSmash' ? 300 : 200)) {
                        e.stunTimer = 180; // 3 sec stun
                        applyDamage(e, baseDamage, 0);
                    }
                });
                break;
            case 'DragonBuster':
                for(let i=0; i<3; i++) {
                    setTimeout(() => {
                        state.projectiles.push({
                            id: Math.random().toString(),
                            x: player.x + player.direction * 50, y: player.y + 20,
                            width: 60, height: 40, vx: player.direction * 10, vy: 0,
                            damage: baseDamage, color: 'red', emoji: '🐉', life: 20, isDead: false, isMagic: true
                        });
                    }, i * 100);
                }
                break;

            // --- LANCER ---
            case 'DoubleStab':
            case 'SpearCrusher':
            case 'SpearPanic':
                SoundService.playAttack();
                const lhits = skillId === 'DoubleStab' ? 2 : 1;
                for(let h=0; h<lhits; h++) {
                    setTimeout(() => {
                        state.projectiles.push({
                            id: Math.random().toString(),
                            x: player.x + player.direction * 50, y: player.y + 30,
                            width: skillId === 'SpearCrusher' ? 180 : 100, height: 40,
                            vx: player.direction * 5, vy: 0,
                            damage: baseDamage, color: 'yellow', emoji: '🔱',
                            life: 20, isDead: false, isMagic: true
                        });
                    }, h * 150);
                }
                break;
            case 'LeapAttack':
                player.vy = -18;
                player.vx = player.direction * 5;
                setTimeout(() => {
                    state.projectiles.push({
                        id: Math.random().toString(),
                        x: player.x, y: player.y + 50, width: 100, height: 100,
                        vx: 0, vy: 15, damage: baseDamage, color: 'white', emoji: '⏬', life: 30, isDead: false, isMagic: true
                    });
                }, 300);
                break;
            case 'Guard':
                player.invincibilityTimer = 180; // 3 seconds
                createParticle(player.x, player.y - 50, "SHIELD UP!", "#00ff00", 60);
                SoundService.playEquip(); 
                break;
            case 'DragonRoar':
            case 'Earthquake':
                SoundService.playMagicExplosion();
                state.shakeTimer = 20;
                state.enemies.forEach(e => {
                    if(!e.isDead) {
                        applyDamage(e, baseDamage, 0);
                        if(skillId === 'Earthquake') e.vx = 0; // Slow/Stop
                    }
                });
                break;
            case 'Sacrifice':
                player.hp = Math.max(1, player.hp - player.maxHp * 0.1);
                createParticle(player.x, player.y, "-10% HP", "red");
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: player.x + player.direction * 80, y: player.y, width: 50, height: 50,
                    vx: player.direction * 15, vy: 0, damage: baseDamage, color: 'purple', emoji: '☠️', life: 40, isDead: false, isMagic: true
                });
                break;

            // --- ARCHER ---
            case 'ArrowBlow':
            case 'FireShot':
            case 'IceShot':
                SoundService.playAttack();
                const emoji = skillId === 'FireShot' ? '🔥' : skillId === 'IceShot' ? '❄️' : '🏹';
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: player.x, y: player.y + 30, width: 40, height: 20, // Increased size
                    vx: player.direction * 18, vy: 0,
                    damage: baseDamage, color: 'white', emoji: emoji,
                    life: 60, isDead: false, isMagic: true, rotation: player.direction===1?0:180,
                    skillId: skillId 
                });
                break;
            case 'MultiShot':
            case 'Strafe':
                const count = skillId === 'Strafe' ? 4 : 3;
                const spread = skillId === 'Strafe' ? 0 : 15; 
                for(let i = 0; i < count; i++) {
                    setTimeout(() => {
                        state.projectiles.push({
                            id: Math.random().toString(),
                            x: player.x, y: player.y + 30, width: 30, height: 15, // Increased size
                            vx: player.direction * 18, vy: skillId==='Strafe' ? (Math.random()-0.5)*2 : (i-1)*2,
                            damage: baseDamage, color: 'green', emoji: '➹',
                            life: 60, isDead: false, isMagic: true, rotation: (player.direction===1?0:180) + (skillId==='Strafe'?0:(i-1)*15)
                        });
                    }, i * (skillId==='Strafe' ? 50 : 0));
                }
                break;
            case 'Backstep':
                player.vx = -player.direction * 15; // Jump back
                player.vy = -5; // Small hop
                player.invincibilityTimer = 30; // 0.5s iframe
                // Fire arrow
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: player.x, y: player.y + 30, width: 40, height: 15, // Increased size
                    vx: player.direction * 18, vy: 0,
                    damage: baseDamage, color: 'white', emoji: '🏹',
                    life: 60, isDead: false, isMagic: true, rotation: player.direction===1?0:180,
                    skillId: skillId 
                });
                break;
            case 'SnareTrap':
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: player.x, y: player.y + 40, width: 30, height: 30,
                    vx: 0, vy: 0, damage: baseDamage, color: 'brown', emoji: '🕸️',
                    life: 600, isDead: false, isMagic: true, isTrap: true
                });
                break;
            case 'ArrowRain':
                for(let i=0; i<10; i++) {
                    setTimeout(() => {
                        state.projectiles.push({
                            id: Math.random().toString(),
                            x: player.x + (Math.random()-0.5)*400, y: -200, width: 20, height: 60,
                            vx: 0, vy: 20, damage: baseDamage, color: 'yellow', emoji: '⚡', life: 100, isDead: false, isMagic: true
                        });
                    }, i * 100);
                }
                break;
            case 'Phoenix':
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: player.x, y: player.y - 60, width: 40, height: 40,
                    vx: 0, vy: 0, damage: baseDamage * 0.5, color: 'orange', emoji: '🦅',
                    life: 1200, maxLife: 1200, isDead: false, isMagic: true, isSummon: true, summonTimer: 0
                });
                break;

            // --- GUNNER ---
            case 'DoubleShot':
            case 'RapidFire':
                const rapidCount = skillId === 'RapidFire' ? 5 : 2;
                for(let i=0; i<rapidCount; i++) {
                    setTimeout(() => {
                        state.projectiles.push({
                            id: Math.random().toString(),
                            x: player.x + player.direction * 30, y: player.y + 30,
                            width: 25, height: 25, vx: player.direction * 25, vy: (Math.random()-0.5), // Increased Size
                            damage: baseDamage, color: 'orange', emoji: '🔴', life: 40, isDead: false, isMagic: true, rotation: player.direction===1?0:180
                        });
                        SoundService.playAttack();
                    }, i * 60);
                }
                break;
            case 'Grenade':
            case 'C4':
                const isC4 = skillId === 'C4';
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: player.x, y: player.y + 20, width: 20, height: 20,
                    vx: isC4 ? 0 : player.direction * 6, // Reduced from 8
                    vy: isC4 ? 0 : -8, // Reduced from -10
                    damage: baseDamage, color: 'black', emoji: isC4 ? '🧨' : '💣',
                    life: isC4 ? 900 : 100, isDead: false, isMagic: true, 
                    isTrap: isC4,
                    explosive: !isC4 // Grenade is explosive
                });
                break;
            case 'Flamethrower':
                for(let i=0; i<5; i++) {
                    setTimeout(() => {
                        state.projectiles.push({
                            id: Math.random().toString(),
                            x: player.x + player.direction * 40, y: player.y + 20 + (Math.random()-0.5)*20,
                            width: 30, height: 30, vx: player.direction * 6, vy: (Math.random()-0.5)*2,
                            damage: baseDamage, color: 'red', emoji: '🔥', life: 30, isDead: false, isMagic: true
                        });
                    }, i * 50);
                }
                break;
            case 'IceSplitter':
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: player.x, y: player.y + 25, width: 20, height: 20,
                    vx: player.direction * 15, vy: 0, damage: baseDamage, color: 'blue', emoji: '🧊',
                    life: 60, isDead: false, isMagic: true, skillId: 'IceShot' 
                });
                break;
            case 'Turret':
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: player.x + player.direction * 50, y: player.y + 20, width: 40, height: 40,
                    vx: 0, vy: 0, damage: baseDamage * 0.8, color: 'gray', emoji: '🤖',
                    life: 1800, maxLife: 1800, isDead: false, isMagic: true, isSummon: true, summonTimer: 0
                });
                break;
            case 'AirStrike':
            case 'HomingMissile':
                const mCount = skillId === 'AirStrike' ? 8 : 3;
                for(let i=0; i<mCount; i++) {
                    setTimeout(() => {
                        state.projectiles.push({
                            id: Math.random().toString(),
                            x: skillId==='AirStrike' ? player.x + (Math.random()-0.5)*600 : player.x,
                            y: skillId==='AirStrike' ? -300 : player.y - 50,
                            width: 30, height: 60, vx: skillId==='HomingMissile' ? player.direction*10 : 0, vy: skillId==='HomingMissile' ? -5 : 20,
                            damage: baseDamage, color: 'red', emoji: '🚀', life: 120, isDead: false, isMagic: true,
                            explosive: skillId === 'AirStrike' // AirStrike explodes on impact
                        });
                    }, i * 150);
                }
                break;

            // --- MAGE ---
            case 'MagicClaw':
            case 'FireBall':
                SoundService.playMagicFireball();
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: player.x + player.direction * 40, y: player.y + 20, width: 40, height: 40,
                    vx: player.direction * 12, vy: 0, damage: baseDamage, color: 'purple', emoji: skillId==='FireBall'?'☄️':'🖐️',
                    life: 60, isDead: false, isMagic: true
                });
                break;
            case 'Thunderbolt':
                state.shakeTimer = 8;
                state.enemies.forEach(e => {
                    if (!e.isDead && Math.abs(e.x - player.x) < 450) {
                        createLightning(e.x + e.width/2, e.y + e.height/2);
                        applyDamage(e, baseDamage, 0);
                    }
                });
                break;
            case 'ColdBeam':
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: player.x + player.direction * 150, y: player.y - 100, width: 60, height: 200,
                    vx: 0, vy: 0, damage: baseDamage, color: 'cyan', emoji: '❄️', life: 30, isDead: false, isMagic: true, skillId: 'IceShot'
                });
                break;
            case 'Heal':
                SoundService.playMagicIce();
                player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.5);
                createParticle(player.x, player.y - 40, "HEAL!", "green");
                state.enemies.forEach(e => {
                    if(!e.isDead && (e.type.includes('Zombie') || e.type.includes('Skeleton')) && Math.abs(e.x-player.x)<300) {
                        applyDamage(e, baseDamage, 0);
                    }
                });
                break;
            case 'Teleport':
                SoundService.playMagicThunder();
                createParticle(player.x, player.y - 20, "Teleport!", "#00ffff", 30);
                const targetX = Math.max(0, Math.min(state.worldWidth - player.width, mouseRef.current.x + state.cameraX));
                const targetY = Math.max(0, Math.min(GROUND_Y + 100, mouseRef.current.y)); 
                let finalY = targetY;
                if (finalY > GROUND_Y - player.height) finalY = GROUND_Y - player.height;
                player.x = targetX;
                player.y = finalY;
                player.vx = 0; player.vy = 0;
                break;
            case 'Slow':
                state.enemies.forEach(e => {
                    if (!e.isDead && Math.abs(e.x - player.x) < 400) {
                        e.freezeTimer = 120;
                        createParticle(e.x, e.y, "SLOW", "gray");
                    }
                });
                break;
            case 'Meteor':
            case 'Blizzard':
                SoundService.playMagicExplosion();
                state.shakeTimer = 30;
                const pEmoji = skillId === 'Meteor' ? '☄️' : '🧊';
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: (mouseRef.current.x + state.cameraX) - 100, y: -300, width: 200, height: 200,
                    vx: 0, vy: 25, damage: baseDamage, color: skillId==='Meteor'?'red':'cyan', emoji: pEmoji,
                    life: 200, isDead: false, isMagic: true, skillId: skillId==='Blizzard'?'IceShot':undefined
                });
                break;
            case 'Bahamut':
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: player.x, y: player.y - 100, width: 80, height: 80,
                    vx: 0, vy: 0, damage: baseDamage, color: 'gold', emoji: '🐉',
                    life: 1800, maxLife: 1800, isDead: false, isMagic: true, isSummon: true, summonTimer: 0
                });
                break;

            default:
                createParticle(player.x, player.y, "?", "white");
        }
        
        forceUIUpdate();
    };

    const applyDamage = (enemy: Enemy, rawDamage: number, direction: number, scale = 1.0) => {
        const player = gameState.current.player;
        const damage = Math.floor(rawDamage * (0.8 + Math.random() * 0.4));
        
        const baseCritChance = 0.2;
        const sharpEyesLevel = player.skills['SharpEyes'] || 0;
        let critChance = baseCritChance + (sharpEyesLevel * 0.05);
        if(player.buffs['Concentrate']) critChance += 0.2;
        if(player.buffs['SharpEyes']) critChance += 0.2;

        const isCrit = Math.random() < critChance;
        const finalDamage = isCrit ? damage * 2 : damage;
        
        enemy.hp -= finalDamage;
        if (!enemy.isBoss && enemy.freezeTimer <= 0 && enemy.stunTimer <= 0) {
             // For downward attack (direction 0 or implied), maybe push down or keep x?
             if (direction !== 0) {
                 enemy.vx = direction * 6;
                 enemy.vy = -3;
             } else {
                 // Hit from top?
                 enemy.vy = 5; // Push down
             }
        }
        
        // Vampirism
        const vampLevel = player.skills['Vampirism'] || 0;
        if (vampLevel > 0 && Math.random() < (vampLevel * 0.05)) {
            if (player.hp < player.maxHp) {
                player.hp = Math.min(player.maxHp, player.hp + 5);
                createParticle(player.x, player.y - 30, "+5 HP", "#ff0000");
            }
        }
        
        SoundService.playEnemyHit();
        createParticle(enemy.x, enemy.y, finalDamage.toString(), isCrit ? '#ff00ff' : '#ffff00', 60, scale);
        
        if (enemy.hp <= 0 && !enemy.isDead) {
            enemy.isDead = true;
            // Wisdom & Exp Logic
            const wisdomLevel = player.skills['Wisdom'] || 0;
            const expGain = Math.floor(enemy.expValue * (1 + wisdomLevel * 0.05));
            gameState.current.player.exp += expGain;
            latestProps.current.onEventLog(`${enemy.type} 처치! +${expGain} EXP`);
            
            while (gameState.current.player.exp >= gameState.current.player.maxExp) {
                 checkLevelUp(gameState.current.player);
            }
            
            gameState.current.shakeTimer = enemy.isBoss ? 20 : 5; 
            
            const currentQuest = latestProps.current.currentQuest;
            if (currentQuest && !currentQuest.isCompleted) {
                const baseType = enemy.type.replace('Giant ', '') as keyof typeof ENEMY_TYPES;
                if (baseType === currentQuest.targetMonster) {
                    const dropInfo = ENEMY_TYPES[baseType];
                    if (dropInfo) {
                        spawnItem(enemy.x, enemy.y, 'QuestItem', undefined, dropInfo.dropName, dropInfo.dropEmoji);
                        latestProps.current.onEventLog(`✨ ${dropInfo.dropName} 발견!`);
                    }
                }
            }

            if (!enemy.isBoss) spawnItem(enemy.x, enemy.y);
            
            if (enemy.isBoss) {
                const goldCoins = 5 + Math.floor(Math.random() * 4);
                for(let i=0; i<goldCoins; i++) {
                     const val = 100 + Math.floor(Math.random() * 400);
                     spawnItem(enemy.x + (Math.random()-0.5)*150, enemy.y - 50, 'Gold', undefined, undefined, undefined, val);
                }
                spawnItem(enemy.x + (Math.random()-0.5)*50, enemy.y, 'HpPotion');
                spawnItem(enemy.x + (Math.random()-0.5)*50, enemy.y, 'MpPotion');
                
                // Advanced weapons drop if player is advanced
                const allWeapons: WeaponType[] = ['Sword', 'Spear', 'Bow', 'Gun'];
                if(player.isAdvanced) {
                    allWeapons.push('Greatsword', 'Polearm', 'Crossbow', 'Cannon', 'Staff');
                }
                
                const locked = allWeapons.find(w => !player.unlockedWeapons.includes(w));
                if (locked) spawnItem(enemy.x, enemy.y - 80, 'Weapon', locked);

                latestProps.current.onEventLog("보스를 물리쳤습니다! 막대한 보상 획득!");
                createParticle(enemy.x, enemy.y - 100, "JACKPOT!!", "#ffd700", 200);
            }

            if (Math.random() < 0.2) {
               generateChat(enemy.type).then(text => {
                   createParticle(enemy.x, enemy.y - 40, text, '#fff', 90);
               });
            }
        }
    };

    const checkLevelUp = (player: Player) => {
        if (player.exp >= player.maxExp) {
            player.level++;
            player.sp += 3;
            player.exp -= player.maxExp;
            player.maxExp = LEVELS_EXP[player.level] || player.maxExp * 1.5;
            player.maxHp += 20; player.maxMp += 10;
            player.hp = player.maxHp; player.mp = player.maxMp;
            player.attack += 5;
            SoundService.playLevelUp();
            createParticle(player.x, player.y - 50, "LEVEL UP!", "#00ffff", 150);
            createParticle(player.x, player.y - 80, "+3 SP", "#ffff00", 150);
            latestProps.current.onEventLog(`레벨 ${player.level} 달성! (SP +3)`);
        }
    };

    // --- MAIN UPDATE LOOP ---
    const update = () => {
        if (!gameActive) return;
        const state = gameState.current;
        const player = state.player;

        if (player.isDead) return;

        // ... (Existing Buff & Move Logic) ...
        for (const buffId in player.buffs) {
            player.buffs[buffId]--;
            if (player.buffs[buffId] <= 0) {
                delete player.buffs[buffId];
                latestProps.current.onEventLog(`${buffId} 효과가 끝났습니다.`);
            }
        }

        const hasteLevel = player.skills['Haste'] || 0;
        let speedMult = 1 + hasteLevel * 0.05;
        if (player.buffs['Dash']) speedMult += 0.5; 
        const maxSpeed = MOVE_SPEED * speedMult;

        if (keysPressed.current.has(latestProps.current.keyBindings.RIGHT)) {
            player.vx += 1;
            player.direction = Direction.RIGHT;
        } else if (keysPressed.current.has(latestProps.current.keyBindings.LEFT)) {
            player.vx -= 1;
            player.direction = Direction.LEFT;
        } else {
            player.vx *= FRICTION;
        }
        
        if (player.vx > maxSpeed * 2) player.vx *= 0.9;
        else {
            if (player.vx > maxSpeed) player.vx = maxSpeed;
            if (player.vx < -maxSpeed) player.vx = -maxSpeed;
        }
        if (Math.abs(player.vx) < 0.1) player.vx = 0;

        player.x += player.vx;
        if (player.x < 0) player.x = 0;
        
        player.vy += GRAVITY;
        player.y += player.vy;

        let onGround = false;
        state.platforms.forEach(plat => {
            if (player.x + player.width > plat.x && player.x < plat.x + plat.width) {
                if (player.vy >= 0 && 
                    player.y + player.height >= plat.y && 
                    player.y + player.height - player.vy <= plat.y + 10) { 
                    
                    player.y = plat.y - player.height;
                    player.vy = 0;
                    onGround = true;
                    player.jumps = 0; 
                }
            }
        });

        if (player.y > GROUND_Y + 100) { 
            player.hp = 0;
            player.isDead = true;
            SoundService.playHit();
            latestProps.current.onGameOver();
        }

        const bossAlive = state.enemies.some(e => e.isBoss && !e.isDead);
        if (player.x > state.worldWidth - 50) {
            if (bossAlive) {
                player.x = state.worldWidth - 50;
                if (state.shakeTimer <= 0 && Math.random() < 0.05) {
                    latestProps.current.onEventLog("🔒 보스를 처치해야 이동할 수 있습니다!");
                }
            } else {
                if (state.stageLevel < 99) loadStage(state.stageLevel + 1);
            }
        }

        if (player.attackCooldown > 0) player.attackCooldown--;
        else {
            player.isAttacking = false;
            player.isDownAttacking = false; // Reset down attack state
        }
        if (player.invincibilityTimer > 0) player.invincibilityTimer--;
        
        for (const skillId in player.cooldowns) {
            if (player.cooldowns[skillId] > 0) player.cooldowns[skillId]--;
        }

        let mpRegenChance = 0.05;
        if(player.skills['MPRestore']) mpRegenChance += 0.05 * player.skills['MPRestore'];
        if (Math.random() < mpRegenChance && player.mp < player.maxMp) player.mp += 1;

        // Items Update
        state.items.forEach(item => {
            item.vy += GRAVITY;
            item.x += item.vx;
            item.y += item.vy;
            if (item.y + item.height > GROUND_Y) {
                item.y = GROUND_Y - item.height;
                item.vy = -item.vy * 0.5; 
                item.vx *= 0.9;
            }
            item.life--;
            
            const dist = Math.abs(player.x - item.x);
            if (dist < 150) item.x += (player.x - item.x) * 0.05;

            if (checkCollision(player, item)) {
                 item.life = 0; 
                 if (item.type === 'Gold') {
                     let val = item.value;
                     const greedLevel = player.skills['Greed'] || 0;
                     if(greedLevel>0) val = Math.floor(val * (1+greedLevel*0.1));
                     player.gold += val;
                     SoundService.playCoin();
                     createParticle(player.x, player.y - 20, `+${val}G`, '#ffd700');
                 } else if (item.type === 'HpPotion' || item.type === 'MpPotion') {
                     if(item.type === 'HpPotion') player.hpPotions++; else player.mpPotions++;
                     SoundService.playCoin();
                     createParticle(player.x, player.y - 20, `+1 ${item.type}`, item.type==='HpPotion'?'red':'blue');
                 } else if (item.type === 'Weapon' && item.weaponType) {
                     if (!player.unlockedWeapons.includes(item.weaponType)) {
                         player.unlockedWeapons.push(item.weaponType);
                         player.currentWeapon = item.weaponType;
                         SoundService.playEquip();
                         createParticle(player.x, player.y - 50, `${item.weaponType} UNLOCKED!`, '#ffffff', 180);
                     }
                 } else if (item.type === 'QuestItem') {
                     const { currentQuest, onQuestUpdate, onQuestComplete, onEventLog } = latestProps.current;
                     SoundService.playCoin();
                     createParticle(player.x, player.y - 40, `${item.questItemName} +1`, '#00ff00', 90);
                     if (currentQuest && !currentQuest.isCompleted) {
                         const newCount = Math.min(currentQuest.targetCount, currentQuest.currentCount + 1);
                         onQuestUpdate(newCount);
                         if (newCount >= currentQuest.targetCount) {
                             const rewardExp = currentQuest.rewardExp;
                             player.exp += rewardExp;
                             player.gold += Math.floor(rewardExp/2);
                             onQuestComplete(rewardExp, Math.floor(rewardExp/2));
                             onEventLog("🎉 퀘스트 완료!");
                             createParticle(player.x, player.y - 80, "QUEST COMPLETE!", "#ffff00", 200);
                         }
                     }
                 }
            }
        });
        state.items = state.items.filter(i => i.life > 0);

        state.lightnings.forEach(l => l.life--);
        state.lightnings = state.lightnings.filter(l => l.life > 0);

        state.projectiles.forEach(p => {
            if (!p.isTrap && !p.isSummon) {
                p.x += p.vx;
                p.y += p.vy;
            }
            
            if (p.isSummon) {
                const targetX = player.x + (player.direction * -50);
                const targetY = player.y - 80;
                p.x += (targetX - p.x) * 0.05;
                p.y += (targetY - p.y) * 0.05;
                
                if (p.summonTimer !== undefined) p.summonTimer++;
                if (p.summonTimer && p.summonTimer > 60) {
                    p.summonTimer = 0;
                    const target = state.enemies.find(e => !e.isDead && Math.abs(e.x - p.x) < 400);
                    if (target) {
                        const angle = Math.atan2(target.y - p.y, target.x - p.x);
                        state.projectiles.push({
                            id: Math.random().toString(),
                            x: p.x, y: p.y, width: 15, height: 15,
                            vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10,
                            damage: p.damage, color: 'orange', emoji: '🔥', life: 60, isDead: false, isMagic: true
                        });
                    }
                }
            }

            if (p.trail) p.trail.unshift({x: p.x + p.width/2, y: p.y + p.height/2, alpha: 1.0});
            if (p.trail && p.trail.length > 15) p.trail.pop();
            p.trail?.forEach(t => t.alpha -= 0.05);
            
            if (p.emoji === '💣' || p.emoji === '⏬' || p.emoji === '🧨') { 
                p.vy += 0.2; 
            }
            
            if (p.rotation !== undefined && p.rotationSpeed) {
                p.rotation += p.rotationSpeed;
            } else if (p.emoji === '➹' || p.emoji === '➵') {
                p.rotation = Math.atan2(p.vy, p.vx) * 180 / Math.PI;
            }

            p.life--;
            if (p.life <= 0) {
                p.isDead = true;
                // Cannon Explosion on time out (if it hits ground logic handled below)
                if (p.explosive) {
                    createParticle(p.x, p.y, "BOOM!", "orange", 60);
                    state.shakeTimer = 15;
                    SoundService.playMagicExplosion();
                    state.enemies.forEach(e => {
                        if (!e.isDead && Math.abs(e.x - p.x) < 150 && Math.abs(e.y - p.y) < 150) {
                            applyDamage(e, p.damage, 0);
                        }
                    });
                }
            }

            // Ground collision for explosive
            if (p.explosive && p.y + p.height >= GROUND_Y) {
                p.life = 0; // Trigger death logic above
            }
            
            // Fix for Traps (C4) falling through ground
            if (p.isTrap && p.y + p.height >= GROUND_Y) {
                p.y = GROUND_Y - p.height;
                p.vy = 0;
                p.vx = 0;
            }

            if (!p.isEnemy && p.width > 150 && p.y >= GROUND_Y - 100) { 
                createParticle(p.x + p.width/2, p.y + p.height, "BOOM!!", "red", 50);
                state.shakeTimer = 50; 
                SoundService.playMagicExplosion();
                p.isDead = true;
                state.enemies.forEach(e => {
                    if (!e.isDead) applyDamage(e, p.damage, 0);
                    if (p.skillId === 'IceShot') e.freezeTimer = 180;
                });
            }

            if (p.isEnemy) {
                if (checkCollision(p, player) && !player.isDead && player.invincibilityTimer <= 0) {
                    p.isDead = true;
                    const stoneSkinLevel = player.skills['StoneSkin'] || 0;
                    let damageReduction = 1 - (stoneSkinLevel * 0.03); 
                    if(player.buffs['IronWall']) damageReduction -= 0.2;
                    const rawDmg = p.damage * Math.max(0.1, damageReduction);
                    let actualDamage = Math.max(1, Math.floor(rawDmg));
                    
                    if (player.shield > 0) {
                        if (player.shield >= actualDamage) {
                            player.shield -= actualDamage;
                            actualDamage = 0;
                            createParticle(player.x, player.y - 20, "BLOCK", "#aaaaaa");
                        } else {
                            actualDamage -= player.shield;
                            player.shield = 0;
                        }
                    }

                    if (actualDamage > 0) {
                        player.hp -= actualDamage;
                        player.invincibilityTimer = 60;
                        createParticle(player.x, player.y, `-${actualDamage}`, '#ff0000');
                        state.shakeTimer = 5;
                        SoundService.playHit();
                        if (player.hp <= 0) {
                            player.isDead = true;
                            latestProps.current.onGameOver();
                        }
                    }
                }
            } else {
                // Player Projectile Hits Enemy
                state.enemies.forEach(e => {
                    if (!e.isDead && checkCollision(p, e)) {
                        if (p.isTrap) {
                            p.isDead = true;
                            createParticle(p.x, p.y, "BOOM!", "red", 60);
                            state.shakeTimer = 10;
                            SoundService.playMagicExplosion();
                            applyDamage(e, p.damage * 2, 0);
                            if (p.skillId === 'SnareTrap') e.freezeTimer = 120;
                        } else if (p.explosive) {
                            p.isDead = true; // Explode immediately
                            createParticle(p.x, p.y, "BOOM!", "orange", 60);
                            state.shakeTimer = 15;
                            SoundService.playMagicExplosion();
                            // AoE
                            state.enemies.forEach(subE => {
                                if(!subE.isDead && Math.abs(subE.x - p.x) < 150 && Math.abs(subE.y - p.y) < 150) {
                                    applyDamage(subE, p.damage, p.vx > 0 ? 1 : -1);
                                }
                            });
                        } else if (!p.isSummon) { 
                            if (!p.piercing && p.width <= 150) p.isDead = true; 
                            
                            // === Distance Damage Logic for Ranged Projectiles ===
                            let damageMod = 1.0;
                            const dist = Math.abs(player.x - e.x);
                            
                            if (p.weaponType === 'Bow' || p.weaponType === 'Crossbow') {
                                if (dist < 200) damageMod = 0.6; // Too close
                                else if (dist >= 200 && dist < 500) damageMod = 1.2; // Sweet spot
                            } else if (p.weaponType === 'Gun' || p.weaponType === 'Cannon') {
                                if (dist < 250) damageMod = 1.2; // Close range bonus
                                else if (dist > 500) damageMod = 0.8; // Falloff
                            }
                            
                            applyDamage(e, p.damage * damageMod, p.vx > 0 ? 1 : -1, damageMod);
                            if (p.skillId === 'IceShot' || p.skillId === 'ColdBeam') e.freezeTimer = 120;
                        }
                    }
                });
            }
        });
        state.projectiles = state.projectiles.filter(p => !p.isDead);

        // ... (Enemy update logic remains largely same) ...
        let boss: Enemy | null = null;
        state.enemies.forEach(enemy => {
            if (enemy.isDead) return;
            if (enemy.isBoss) boss = enemy;
            
            if (enemy.freezeTimer > 0) {
                enemy.freezeTimer--;
                if(Math.random() < 0.1) createParticle(enemy.x, enemy.y, "🧊", "cyan", 20);
                return;
            }
            if (enemy.stunTimer > 0) {
                enemy.stunTimer--;
                if(Math.random() < 0.1) createParticle(enemy.x, enemy.y, "💫", "yellow", 20);
                return;
            }

            const dist = Math.abs(player.x - enemy.x);
            const canSeePlayer = Math.abs(player.y - enemy.y) < 100;

            if (enemy.isRanged && dist < 400 && canSeePlayer && enemy.attackTimer <= 0) {
                enemy.attackTimer = 180;
                const config = ENEMY_TYPES[enemy.type.replace('Giant ', '') as keyof typeof ENEMY_TYPES];
                const projectileEmoji = (config as any).projectile || '🔴';
                
                state.projectiles.push({
                    id: Math.random().toString(),
                    x: enemy.x + enemy.width/2,
                    y: enemy.y + enemy.height/2,
                    width: 20, height: 20,
                    vx: (player.x > enemy.x ? 1 : -1) * 7,
                    vy: 0,
                    damage: enemy.damage,
                    color: 'red',
                    emoji: projectileEmoji,
                    life: 100, isDead: false, isMagic: false, isEnemy: true
                });
                enemy.vx = 0;
            } else {
                if (enemy.attackTimer > 0) enemy.attackTimer--;
                if (dist < 400 || enemy.isBoss) {
                    if (player.x > enemy.x) enemy.direction = Direction.RIGHT; else enemy.direction = Direction.LEFT;
                } else {
                    if (enemy.x > enemy.patrolEnd) enemy.direction = Direction.LEFT;
                    if (enemy.x < enemy.patrolStart) enemy.direction = Direction.RIGHT;
                }
                enemy.vx = enemy.direction * (ENEMY_TYPES[enemy.type.replace('Giant ', '') as keyof typeof ENEMY_TYPES]?.speed || 1);
                if (enemy.isBoss) enemy.vx *= 0.7;
                enemy.x += enemy.vx;
            }
            
            enemy.vy += GRAVITY;
            enemy.y += enemy.vy;
            
            state.platforms.forEach(plat => {
                 if (enemy.vy >= 0 && enemy.y + enemy.height >= plat.y && enemy.y + enemy.height - enemy.vy <= plat.y + 10 &&
                     enemy.x + enemy.width > plat.x && enemy.x < plat.x + plat.width) {
                     enemy.y = plat.y - enemy.height;
                     enemy.vy = 0;
                 }
            });

            if (checkCollision(player, enemy) && !enemy.isDead) {
                if (player.invincibilityTimer <= 0) {
                    const evasionLevel = player.skills['Evasion'] || 0;
                    let dodgeChance = evasionLevel * 0.03;
                    if(player.buffs['Concentrate']) dodgeChance += 0.2;

                    if (Math.random() < dodgeChance) {
                        createParticle(player.x, player.y - 20, "MISS", "#888888");
                        return;
                    }

                    const stoneSkinLevel = player.skills['StoneSkin'] || 0;
                    let damageReduction = 1 - (stoneSkinLevel * 0.03); 
                    if(player.buffs['IronWall']) damageReduction -= 0.2;
                    if(player.buffs['Battleship']) damageReduction -= 0.3;

                    const rawDmg = enemy.damage * Math.max(0.1, damageReduction);
                    let actualDamage = Math.max(1, Math.floor(rawDmg));

                    const magicGuardLevel = player.skills['MagicGuard'] || 0;
                    if (magicGuardLevel > 0 && player.mp > actualDamage * 0.5) {
                        const mpDmg = Math.floor(actualDamage * 0.8);
                        player.mp -= mpDmg;
                        actualDamage -= mpDmg;
                        createParticle(player.x, player.y - 40, `-${mpDmg} MP`, "blue");
                    }
                    
                    if (player.shield > 0) {
                        if (player.shield >= actualDamage) {
                            player.shield -= actualDamage;
                            actualDamage = 0;
                            createParticle(player.x, player.y - 20, "BLOCK", "#aaaaaa");
                        } else {
                            actualDamage -= player.shield;
                            player.shield = 0;
                        }
                    }

                    const reflectLevel = player.skills['PowerGuard'] || 0;
                    if (reflectLevel > 0) {
                        const reflectDmg = actualDamage * (0.2 + reflectLevel * 0.05);
                        applyDamage(enemy, reflectDmg, 0);
                        createParticle(enemy.x, enemy.y, `Reflect ${Math.floor(reflectDmg)}`, "orange");
                    }

                    if (actualDamage > 0) {
                        player.hp -= actualDamage;
                        player.vx = enemy.direction === Direction.RIGHT ? 8 : -8;
                        player.vy = -5;
                        player.invincibilityTimer = 60;
                        createParticle(player.x, player.y, `-${actualDamage}`, '#ff0000');
                        state.shakeTimer = 5;
                        SoundService.playHit();
                        if (player.hp <= 0) {
                            player.isDead = true;
                            latestProps.current.onGameOver();
                        }
                    }
                }
            }
        });
        state.enemies = state.enemies.filter(e => !e.isDead);

        if (state.enemies.length < 5 + state.stageLevel && !state.enemies.some(e => e.isBoss)) {
            if(Math.random() < 0.02) {
                 const allowedMonsters = Object.entries(ENEMY_TYPES).filter(([key, _]) => {
                    if (state.biomeIndex === 0) return ['Snail', 'Slime', 'Mushroom', 'Boar'].includes(key);
                    return true;
                 }).map(([key]) => key);
                 const type = allowedMonsters[Math.floor(Math.random() * allowedMonsters.length)] || 'Slime';
                 spawnEnemy(Math.random() * state.worldWidth, type as any);
            }
        }

        const targetCamX = player.x - VIEWPORT_WIDTH / 2 + player.width / 2;
        state.cameraX += (targetCamX - state.cameraX) * 0.1;
        if (state.cameraX < 0) state.cameraX = 0;
        if (state.cameraX > state.worldWidth - VIEWPORT_WIDTH) state.cameraX = state.worldWidth - VIEWPORT_WIDTH;

        state.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
        state.particles = state.particles.filter(p => p.life > 0);

        const biome = BIOMES[state.biomeIndex];
        onStatsUpdate({ ...player }, boss, state.stageLevel, biome.name);
    };

    // --- DRAW FUNCTION ---
    const draw = (ctx: CanvasRenderingContext2D) => {
        const state = gameState.current;
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        // Background
        const biome = BIOMES[state.biomeIndex] || BIOMES[0];
        
        // Sky Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, biome.sky[0]);
        gradient.addColorStop(1, biome.sky[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Custom Background Image
        if (bgImageRef.current) {
             ctx.drawImage(bgImageRef.current, 0, 0, width, height);
        }

        ctx.save();
        
        // Camera Shake
        if (state.shakeTimer > 0) {
            const shake = (Math.random() - 0.5) * 10;
            ctx.translate(shake, shake);
            state.shakeTimer--;
        }
        
        ctx.translate(-state.cameraX, 0);

        // Draw Platforms
        ctx.fillStyle = biome.ground;
        state.platforms.forEach(p => {
            ctx.fillRect(p.x, p.y, p.width, p.height);
            // Grass top
            ctx.fillStyle = biome.top;
            ctx.fillRect(p.x, p.y, p.width, 10);
            ctx.fillStyle = biome.ground;
        });

        // Draw Items
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        state.items.forEach(item => {
             ctx.fillText(item.emoji, item.x + 15, item.y + 15);
             if(item.type === 'Weapon') {
                 // Glow effect for weapon drops
                 ctx.shadowColor = 'white';
                 ctx.shadowBlur = 10;
                 ctx.fillText(item.emoji, item.x + 15, item.y + 15);
                 ctx.shadowBlur = 0;
             }
        });

        // Draw Enemies
        state.enemies.forEach(enemy => {
            if(enemy.isDead) return;
            
            ctx.save();
            ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            if(enemy.direction === Direction.LEFT) ctx.scale(-1, 1);
            
            // Boss scaling
            const fontSize = enemy.isBoss ? 80 : 40;
            ctx.font = `${fontSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw Emoji
            ctx.fillText(enemy.emoji, 0, 0);
            
            // Frozen effect
            if(enemy.freezeTimer > 0) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, enemy.width/1.5, 0, Math.PI*2);
                ctx.fill();
            }
            
            // Stun effect
            if(enemy.stunTimer > 0) {
                 ctx.font = '20px serif';
                 ctx.fillText("💫", 0, -enemy.height/2 - 10);
            }

            ctx.restore();

            // Enemy HP Bar (Not for boss as it has overlay)
            if (!enemy.isBoss) {
                const hpPct = enemy.hp / enemy.maxHp;
                ctx.fillStyle = 'red';
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * hpPct, 5);
            }
        });

        // --- PLAYER DRAWING ---
        const player = state.player;
        if (!player.isDead) {
            ctx.save();
            ctx.translate(player.x + player.width/2, player.y + player.height/2);
            if (player.invincibilityTimer > 0) ctx.globalAlpha = 0.5 + Math.sin(Date.now()/50)*0.4;
            ctx.scale(player.direction === Direction.LEFT ? 1 : -1, 1);

            const isMoving = Math.abs(player.vx) > 0.1;
            const t = Date.now();
            const walk = isMoving ? Math.sin(t / 100) : 0;
            const breathe = Math.sin(t / 300) * 1;

            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath(); ctx.ellipse(0, 28, 12, 4, 0, 0, Math.PI*2); ctx.fill();

            let capeColor = '#c0392b';
            if (player.classType === 'Archer') capeColor = '#2ecc71';
            if (player.classType === 'Mage') capeColor = '#8e44ad';
            if (player.classType === 'Gunner') capeColor = '#7f8c8d'; 
            
            // Advanced Class Cape - more majestic
            if (player.isAdvanced) {
                if (player.classType === 'Warrior') capeColor = '#7f0000'; // Dark Red
                if (player.classType === 'Lancer') capeColor = '#d35400'; // Dark Orange
                if (player.classType === 'Mage') capeColor = '#4a235a'; // Deep Purple
            }

            ctx.fillStyle = capeColor;
            ctx.beginPath(); ctx.moveTo(4, -15 + breathe);
            const capeWave = isMoving ? Math.sin(t/100)*5 : Math.sin(t/300)*2;
            ctx.quadraticCurveTo(25, 0, 20 + capeWave, 25 + (player.isAdvanced ? 10 : 0)); 
            ctx.lineTo(8, 25 + (player.isAdvanced ? 10 : 0)); ctx.lineTo(4, -15 + breathe); ctx.fill();

            let armorColor = '#3498db';
            if (player.classType === 'Warrior') armorColor = '#c0392b';
            if (player.classType === 'Archer') armorColor = '#27ae60';
            if (player.classType === 'Lancer') armorColor = '#f39c12';
            if (player.classType === 'Mage') armorColor = '#2c3e50';
            
            // Legs
            ctx.fillStyle = '#2c3e50'; ctx.save(); ctx.translate(2, 10); ctx.rotate(-walk * 0.5); ctx.fillRect(-3, 0, 6, 16); ctx.fillStyle = '#95a5a6'; ctx.fillRect(-4, 12, 8, 5); ctx.restore();
            ctx.fillStyle = '#7f8c8d'; ctx.save(); ctx.translate(5, -8 + breathe); ctx.rotate(walk * 0.6); ctx.fillRect(-3, 0, 6, 14); ctx.beginPath(); ctx.arc(0, 14, 3, 0, Math.PI*2); ctx.fill(); ctx.restore();

            // Torso
            ctx.fillStyle = armorColor; ctx.beginPath(); ctx.moveTo(-6, -15 + breathe); ctx.lineTo(6, -15 + breathe); ctx.lineTo(5, 10); ctx.lineTo(-5, 10); ctx.fill();
            ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.moveTo(-6, -15 + breathe); ctx.lineTo(6, -15 + breathe); ctx.lineTo(0, 0 + breathe); ctx.fill(); // Collar
            ctx.fillStyle = '#f1c40f'; ctx.fillRect(-6, 8, 12, 3); // Belt

            // Head
            ctx.save(); ctx.translate(0, breathe);
            ctx.fillStyle = '#f5cba7'; ctx.beginPath(); ctx.arc(0, -22, 9, 0, Math.PI*2); ctx.fill(); // Skin
            
            // Helmet / Hat
            if (player.classType === 'Warrior' || player.classType === 'Lancer') {
                ctx.fillStyle = player.isAdvanced ? '#34495e' : '#95a5a6'; 
                ctx.beginPath(); ctx.arc(0, -24, 10, Math.PI, 0); ctx.lineTo(4, -18); ctx.lineTo(4, -24); ctx.lineTo(-2, -24); ctx.fill();
                ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.moveTo(6, -24); ctx.lineTo(14, -28); ctx.lineTo(8, -20); ctx.fill(); 
            } else if (player.classType === 'Mage') {
                ctx.fillStyle = '#8e44ad'; ctx.beginPath(); ctx.moveTo(-12, -26); ctx.lineTo(12, -26); ctx.lineTo(0, -45); ctx.fill();
                ctx.beginPath(); ctx.ellipse(0, -26, 14, 3, 0, 0, Math.PI*2); ctx.fill();
            } else if (player.classType === 'Archer') {
                ctx.fillStyle = '#27ae60'; ctx.beginPath(); ctx.arc(0, -24, 10, Math.PI, 0); ctx.fill();
            } else {
                ctx.fillStyle = '#2c3e50'; ctx.beginPath(); ctx.arc(0, -24, 9.5, Math.PI, 0); ctx.fill(); 
                ctx.fillStyle = '#333'; ctx.fillRect(2, -24, 8, 4); 
                ctx.fillStyle = '#00ffff'; ctx.fillRect(3, -23, 2, 2); ctx.fillRect(7, -23, 2, 2);
            }

            ctx.fillStyle = '#2c3e50'; ctx.beginPath(); ctx.arc(-4, -21, 1.5, 0, Math.PI*2); ctx.fill(); 
            ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(2, -14, 3, 0, Math.PI*2); ctx.fill(); 
            ctx.restore();

            // Arm
            ctx.fillStyle = armorColor; ctx.save(); ctx.translate(-2, 10); ctx.rotate(walk * 0.5); ctx.fillRect(-3, 0, 6, 16); ctx.fillStyle = '#95a5a6'; ctx.fillRect(-4, 12, 8, 5); ctx.restore();

            // Shield Visual
            if (player.shield > 0 || player.buffs['IronWall']) {
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#3498db';
                ctx.beginPath();
                ctx.arc(0, 0, 35, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            }
            if(player.buffs['Battleship']) {
                ctx.save();
                ctx.translate(0, 20);
                ctx.fillStyle = '#555';
                ctx.fillRect(-25, 0, 50, 15); 
                ctx.fillStyle = '#333';
                ctx.beginPath(); ctx.arc(0, 15, 8, 0, Math.PI*2); ctx.fill();
                ctx.restore();
            }

            // Weapon Render
            const weapon = WEAPONS[player.currentWeapon];
            if (weapon) {
                 ctx.save(); ctx.translate(-6, -4 + breathe); 
                 const progress = player.isAttacking ? 1 - (player.attackCooldown / player.maxAttackCooldown) : 0;
                 ctx.fillStyle = armorColor; ctx.beginPath(); ctx.arc(4, -8, 6, 0, Math.PI*2); ctx.fill(); 
                 
                 let armRotation = Math.PI * -0.1 + (walk * 0.1);
                 let weaponOffsetX = 0; let weaponOffsetY = 0;

                 const isStabbing = (player.currentWeapon === 'Spear' || player.currentWeapon === 'Polearm');

                 if (player.isAttacking) {
                     if (weapon.type === 'ranged') {
                        // Ranged: Recoil
                        const recoil = Math.sin(progress * Math.PI); 
                        armRotation -= recoil * 0.2; 
                        weaponOffsetX = -recoil * 5; 
                        
                        if (player.isDownAttacking) {
                            armRotation = Math.PI * 0.3; // Point down
                        }
                     } else {
                        // Melee Logic
                        if (player.isDownAttacking) {
                            armRotation = Math.PI * 0.6; // Downward stab
                            weaponOffsetX = 5;
                            weaponOffsetY = 15;
                        } else {
                            if (isStabbing) {
                                // Stab Animation (Thrust)
                                armRotation = Math.PI; // Forward
                                const stab = Math.sin(progress * Math.PI) * 40;
                                weaponOffsetX = stab;
                            } else {
                                // Swing Animation
                                const startAngle = -Math.PI * 0.25; const endAngle = -Math.PI * 1.25; 
                                const ease = 1 - Math.pow(1 - progress, 3);
                                armRotation = startAngle + (endAngle - startAngle) * ease;
                            }
                        }
                     }
                 } else if (isStabbing) {
                     // Idle position for spears - Point forward-up
                     armRotation = Math.PI * 0.95;
                 }

                 ctx.rotate(armRotation); ctx.translate(weaponOffsetX, weaponOffsetY);
                 ctx.fillStyle = '#7f8c8d'; ctx.beginPath(); ctx.rect(0, -4, 12, 8); ctx.fill(); ctx.beginPath(); ctx.arc(12, 0, 5, 0, Math.PI*2); ctx.fill(); 
                 
                 // --- Spear / Polearm Custom Drawing (No Emoji) ---
                 if (isStabbing) {
                     // Rotate to align with arm
                     ctx.save();
                     // Default emoji draw was offset by translate(14,0). Let's start from hand center (0,0 is hand pivot)
                     
                     // Draw Shaft
                     ctx.strokeStyle = '#5d4037'; // Dark wood
                     ctx.lineWidth = 4;
                     ctx.beginPath();
                     ctx.moveTo(-10, 0); 
                     ctx.lineTo(80, 0); 
                     ctx.stroke();

                     // Draw Blade
                     if (player.currentWeapon === 'Polearm') {
                         // Polearm Blade (Curved) - Flipped Y to look correct when rotated PI
                         ctx.fillStyle = '#b0bec5'; // Silver
                         ctx.beginPath();
                         ctx.moveTo(75, 0);
                         ctx.quadraticCurveTo(90, 20, 110, 5); // Flipped Control Point & End Point Y
                         ctx.lineTo(100, -5); // Flipped
                         ctx.lineTo(75, -5); // Flipped
                         ctx.fill();
                         // Decor
                         ctx.fillStyle = '#c0392b'; // Red tassel
                         ctx.beginPath(); ctx.arc(75, 0, 4, 0, Math.PI*2); ctx.fill();
                     } else {
                         // Regular Spear Tip (Pointy)
                         ctx.fillStyle = '#cfd8dc'; 
                         ctx.beginPath();
                         ctx.moveTo(78, -4);
                         ctx.lineTo(110, 0);
                         ctx.lineTo(78, 4);
                         ctx.fill();
                         ctx.fillStyle = '#3498db'; // Blue wrap
                         ctx.fillRect(70, -2, 8, 4);
                     }
                     ctx.restore();

                 } else {
                     // --- Default Emoji Rendering ---
                     ctx.fillStyle = 'white'; 
                     
                     // Size adjustment for big weapons
                     const isBigWeapon = ['Greatsword', 'Cannon', 'Staff'].includes(player.currentWeapon);
                     ctx.font = isBigWeapon ? '45px serif' : '30px serif';
                     
                     ctx.save(); ctx.translate(14, 0); 
                     
                     // Rotation adjustments per weapon
                     if (player.currentWeapon === 'Sword') ctx.rotate(Math.PI / 4); 
                     if (player.currentWeapon === 'Greatsword') ctx.rotate(Math.PI / 4);
                     if (player.currentWeapon === 'Bow' || player.currentWeapon === 'Crossbow') ctx.rotate(Math.PI / 4 * 5); 
                     if (player.currentWeapon === 'Staff') ctx.rotate(Math.PI / 2);
                     // Removed scaling flip for Gun to fix "upside down" issue
                     
                     ctx.fillText(weapon.emoji, 0, 0); ctx.restore(); 
                 }
                 
                 ctx.restore(); // End Hand Transform
                 
                 // Draw Visual Range Arc for melee if attacking (Standard Swing Arc)
                 // For stabbing, we might want a "thrust line" or just keep the particle effect
                 if (player.isAttacking && weapon.type === 'melee' && !player.isDownAttacking && !isStabbing) {
                     ctx.save();
                     ctx.rotate(-armRotation); // Unrotate to player space
                     ctx.translate(-weaponOffsetX - 14, -weaponOffsetY); // Back to shoulder
                     ctx.globalAlpha = 0.2 * (progress); // Fade out
                     ctx.fillStyle = 'white';
                     ctx.beginPath();
                     ctx.arc(0, 0, weapon.range, -Math.PI * 0.5, 0.5); // Simple forward arc
                     ctx.lineTo(0,0);
                     ctx.fill();
                     ctx.restore();
                 }
                 // Visual for Stabbing
                 if (player.isAttacking && isStabbing && !player.isDownAttacking) {
                     ctx.save();
                     ctx.globalAlpha = 0.3 * progress;
                     ctx.fillStyle = 'white';
                     ctx.beginPath();
                     // Draw a "whoosh" line forward (rotated frame)
                     ctx.rect(20, -2, weapon.range * progress, 4);
                     ctx.fill();
                     ctx.restore();
                 }
            }
            ctx.restore();
        }

        // Draw Projectiles
        state.projectiles.forEach(p => {
            ctx.save();
            ctx.translate(p.x + p.width/2, p.y + p.height/2);
            
            // Flip summons (Phoenix 🦅, Bahamut 🐉) to face player direction
            // These emojis face LEFT by default. If player faces RIGHT, flip them.
            if (p.isSummon && (p.emoji === '🦅' || p.emoji === '🐉')) {
                if (state.player.direction === Direction.RIGHT) {
                    ctx.scale(-1, 1);
                }
            }

            // Draw Summon Duration Timer
            if (p.isSummon && p.maxLife) {
                const barW = 30;
                const barH = 4;
                const yOff = -p.height / 2 - 10;
                
                // Background
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(-barW/2, yOff, barW, barH);
                
                // Progress
                const pct = p.life / p.maxLife;
                ctx.fillStyle = pct > 0.2 ? '#00ff00' : '#ff0000';
                ctx.fillRect(-barW/2, yOff, barW * pct, barH);

                // Time Text
                ctx.fillStyle = 'white';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.ceil(p.life/60)}s`, 0, yOff - 5);
            }

            if (p.rotation) ctx.rotate(p.rotation * Math.PI / 180);
            
            // INCREASE FONT SIZE LOGIC
            // Ensure font is at least 30px or matches width, to make emojis visible
            const baseSize = Math.max(30, p.width);
            ctx.font = `${baseSize}px serif`;
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.emoji, 0, 0);
            
            ctx.restore();

            // Trail
            if (p.trail) {
                p.trail.forEach(t => {
                    ctx.globalAlpha = t.alpha;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, 4, 0, Math.PI*2); // Slightly larger trail
                    ctx.fill();
                });
                ctx.globalAlpha = 1.0;
            }
        });

        // Draw Lightnings
        state.lightnings.forEach(l => {
             ctx.strokeStyle = l.color;
             ctx.lineWidth = l.width;
             ctx.beginPath();
             if(l.points.length > 0) ctx.moveTo(l.points[0].x, l.points[0].y);
             for(let i=1; i<l.points.length; i++) ctx.lineTo(l.points[i].x, l.points[i].y);
             ctx.stroke();
        });

        // Draw Particles (Damage Numbers, Effects)
        state.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.font = `bold ${20 * (p.scale || 1)}px Arial`;
            ctx.textAlign = 'center';
            // Stroke for readability
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.strokeText(p.text, p.x, p.y);
            ctx.fillText(p.text, p.x, p.y);
            ctx.restore();
        });
        
        ctx.restore();
    };

    const tick = () => {
        update();
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) draw(ctx);
        }
        requestRef.current = requestAnimationFrame(tick);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(tick);
        // REMOVED loadStage(1) from here to prevent reset on menu open/close
        return () => {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
        };
    }, [gameActive]);

    // Input Handling (remains same)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isControlKey = Object.values(latestProps.current.keyBindings).includes(e.code);
            if (isControlKey && gameActive) {
                keysPressed.current.add(e.code);
            }

            if (gameActive) {
                const binds = latestProps.current.keyBindings;
                if (e.code === binds.ATTACK) attemptAttack();
                if (e.code === binds.POTION_HP) usePotion('HP');
                if (e.code === binds.POTION_MP) usePotion('MP');
                if (e.code === binds.JUMP) {
                    const player = gameState.current.player;
                    const canDoubleJump = (player.skills['DoubleJump'] || 0) > 0;
                    const limit = canDoubleJump ? 2 : 1;
                    if (player.jumps < limit) {
                        player.vy = JUMP_FORCE;
                        player.jumps++;
                        SoundService.playJump();
                        if (player.jumps > 1) {
                            createParticle(player.x, player.y + 40, "Double Jump!", "#ffffff", 40);
                        }
                    }
                }
                if (e.code === binds.SKILL_1) useActiveSkill(binds.SKILL_1);
                if (e.code === binds.SKILL_2) useActiveSkill(binds.SKILL_2);
                if (e.code === binds.SKILL_3) useActiveSkill(binds.SKILL_3);
                if (e.code === binds.SKILL_4) useActiveSkill(binds.SKILL_4);
                if (e.code === binds.SKILL_5) useActiveSkill(binds.SKILL_5);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.code);
        
        const handleMouseMove = (e: MouseEvent) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };
        const handleMouseDown = () => { if(gameActive) attemptAttack(); };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
        };
    }, [gameActive]);

    return <canvas ref={canvasRef} width={VIEWPORT_WIDTH} height={VIEWPORT_HEIGHT} className="bg-blue-200 shadow-xl rounded-lg cursor-crosshair" />;
});

export default GameCanvas;