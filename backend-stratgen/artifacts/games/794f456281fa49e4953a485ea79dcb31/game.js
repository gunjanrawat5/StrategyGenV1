(function () {
  'use strict';
  const PLAN = {"title": "Neon Highway Racer", "genre": "Arcade Survival", "core_loop": "Steer left and right to avoid oncoming traffic and survive to reach the target score.", "controls": ["ArrowLeft", "ArrowRight", "R"], "mechanics": ["dodge", "survive"], "player": {"speed": 350.0, "radius": 16, "color": "#00ffff", "health": 1}, "enemy_archetypes": [{"id": "oncoming_car", "movement": "fall", "speed": 280.0, "radius": 18, "color": "#ff3300", "count": 8}], "player_rules": ["Player movement is restricted to the horizontal axis.", "Collision with any enemy car results in immediate game over."], "enemy_rules": ["Enemy cars spawn at the top of the screen at random horizontal positions.", "Enemy cars move vertically downwards to simulate oncoming traffic.", "Enemy cars reset to the top once they pass the bottom boundary."], "physics_rules": {"gravity": 0.0, "max_speed": 500.0, "friction": 0.1}, "win_condition": "Reach a score of 100.", "lose_condition": "Collision with an oncoming car.", "ui_text": {"title": "Neon Highway Racer", "hint": "Use Left/Right arrows to dodge traffic. Reach 100 points to win!", "reset": "Press R to restart"}, "difficulty": {"enemy_spawn_interval_ms": 500, "enemy_speed": 280.0, "score_per_enemy": 2, "target_score": 100}, "scene_graph_objects": [{"id": "player_car", "kind": "player"}, {"id": "traffic_unit", "kind": "enemy"}, {"id": "road_marking", "kind": "decoration"}]};
  if (!window.Phaser) throw new Error('Phaser runtime was not loaded.');
  const width = 960;
  const height = 600;

  function showRuntimeError(message) {
    const root = document.getElementById('game-root');
    if (!root) return;
    const box = document.createElement('pre');
    box.textContent = 'Runtime Error\n' + String(message || 'Unknown error');
    box.style.color = '#ffb3c1';
    box.style.background = '#140812';
    box.style.border = '1px solid #ff4d6d';
    box.style.padding = '12px';
    box.style.margin = '12px';
    box.style.whiteSpace = 'pre-wrap';
    root.innerHTML = '';
    root.appendChild(box);
  }
  window.addEventListener('error', function (event) {
    showRuntimeError(event && event.message ? event.message : event);
  });

  // BEGIN GENERATED_SCENE_MODULE
function createGeneratedScene(Phaser, PLAN) {
  return class GeneratedScene extends Phaser.Scene {
    constructor() {
      super({ key: 'NeonHighwayScene' });
      this.score = 0;
      this.isGameOver = false;
      this.isGameWon = false;
    }

    preload() {
      // Create procedural textures
      const createRectTexture = (key, color, width, height, isPlayer) => {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        const colorValue = parseInt(color.replace('#', '0x'));
        
        // Body
        graphics.fillStyle(colorValue, 1);
        graphics.fillRect(0, 0, width, height);
        
        // Detail (Windshield)
        graphics.fillStyle(0xffffff, 0.6);
        if (isPlayer) {
          graphics.fillRect(4, 4, width - 8, 6);
        } else {
          graphics.fillRect(4, height - 10, width - 8, 6);
        }
        
        // Glow effect
        graphics.lineStyle(2, colorValue, 0.8);
        graphics.strokeRect(0, 0, width, height);
        
        graphics.generateTexture(key, width, height);
      };

      createRectTexture('player_car', PLAN.player.color, 32, 48, true);
      createRectTexture('enemy_car', PLAN.enemy_archetypes[0].color, 32, 48, false);

      // Road line texture
      const lineGen = this.make.graphics({ x: 0, y: 0, add: false });
      lineGen.fillStyle(0xffffff, 0.5);
      lineGen.fillRect(0, 0, 4, 40);
      lineGen.generateTexture('road_line', 4, 40);
    }

    create() {
      const { width, height } = this.scale;
      this.score = 0;
      this.isGameOver = false;
      this.isGameWon = false;

      // Background
      this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0f);

      // Road boundaries
      const roadGfx = this.add.graphics();
      roadGfx.lineStyle(4, 0x3333ff, 0.5);
      roadGfx.lineBetween(50, 0, 50, height);
      roadGfx.lineBetween(width - 50, 0, width - 50, height);

      // Road markings group
      this.roadLines = this.add.group();
      for (let i = 0; i < 10; i++) {
        const line = this.add.sprite(width / 2, i * 80, 'road_line');
        this.roadLines.add(line);
      }

      // Player
      this.player = this.physics.add.sprite(width / 2, height - 80, 'player_car');
      this.player.setCollideWorldBounds(true);
      this.player.setCircle(PLAN.player.radius, 0, 8);

      // Enemies
      this.enemies = this.physics.add.group();
      const enemyData = PLAN.enemy_archetypes[0];
      for (let i = 0; i < enemyData.count; i++) {
        this.spawnEnemy(true);
      }

      // Collisions
      this.physics.add.overlap(this.player, this.enemies, this.handleCollision, null, this);

      // UI
      const textStyle = { font: '20px Courier', fill: '#00ffff', align: 'center' };
      this.scoreText = this.add.text(20, 20, `Score: 0`, textStyle);
      this.titleText = this.add.text(width / 2, 40, PLAN.title, { ...textStyle, fontSize: '32px', fontWeight: 'bold' }).setOrigin(0.5);
      this.hintText = this.add.text(width / 2, height - 30, PLAN.ui_text.hint, { ...textStyle, fontSize: '14px' }).setOrigin(0.5);

      this.gameOverText = this.add.text(width / 2, height / 2, '', { ...textStyle, fontSize: '40px', fill: '#ff0000' }).setOrigin(0.5);
      this.winText = this.add.text(width / 2, height / 2, '', { ...textStyle, fontSize: '40px', fill: '#00ff00' }).setOrigin(0.5);
      this.resetText = this.add.text(width / 2, height / 2 + 60, '', { ...textStyle, fontSize: '20px' }).setOrigin(0.5);

      // Controls
      this.cursors = this.input.keyboard.createCursorKeys();
      this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    }

    spawnEnemy(initial = false) {
      const { width, height } = this.scale;
      const x = Phaser.Math.Between(80, width - 80);
      const y = initial ? Phaser.Math.Between(-height, 0) : -50;
      
      let enemy = this.enemies.getFirstDead();
      if (!enemy) {
        enemy = this.enemies.create(x, y, 'enemy_car');
      } else {
        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.setPosition(x, y);
      }
      
      enemy.setCircle(PLAN.enemy_archetypes[0].radius, 0, 8);
      enemy.setVelocityY(PLAN.enemy_archetypes[0].speed);
    }

    handleCollision(player, enemy) {
      if (this.isGameOver || this.isGameWon) return;
      
      this.isGameOver = true;
      this.physics.pause();
      this.player.setTint(0xff0000);
      this.gameOverText.setText('GAME OVER');
      this.resetText.setText(PLAN.ui_text.reset);
    }

    update() {
      if (this.isGameOver || this.isGameWon) {
        if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
          this.scene.restart();
        }
        return;
      }

      // Player Movement
      this.player.setVelocityX(0);
      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-PLAN.player.speed);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(PLAN.player.speed);
      }

      // Road scrolling
      this.roadLines.children.iterate((line) => {
        line.y += 5;
        if (line.y > this.scale.height) {
          line.y = -40;
        }
      });

      // Enemy logic
      this.enemies.children.iterate((enemy) => {
        if (enemy.active && enemy.y > this.scale.height + 50) {
          this.score += PLAN.difficulty.score_per_enemy;
          this.scoreText.setText(`Score: ${this.score}`);
          
          // Reset enemy to top
          enemy.y = -50;
          enemy.x = Phaser.Math.Between(80, this.scale.width - 80);
          
          // Check Win Condition
          if (this.score >= PLAN.difficulty.target_score) {
            this.winGame();
          }
        }
      });
    }

    winGame() {
      this.isGameWon = true;
      this.physics.pause();
      this.winText.setText('YOU WIN!');
      this.resetText.setText(PLAN.ui_text.reset);
    }
  };
}
  // END GENERATED_SCENE_MODULE

  if (typeof createGeneratedScene !== 'function') {
    throw new Error('Generated module must define createGeneratedScene(Phaser, PLAN).');
  }

  const GeneratedScene = createGeneratedScene(Phaser, PLAN);
  const config = {
    type: Phaser.CANVAS,
    width: 960,
    height: 600,
    parent: 'game-root',
    backgroundColor: '#030915',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: Number(PLAN.physics_rules?.gravity || 0) },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    fps: { target: 60, forceSetTimeOut: false },
    scene: [GeneratedScene],
  };

  let phaser = null;
  try {
    phaser = new Phaser.Game(config);
  } catch (error) {
    showRuntimeError(error && error.message ? error.message : error);
  }
  window.__ggen_runtime__ = {
    phaser,
    dispose() {
      if (this.phaser) {
        this.phaser.destroy(true);
        this.phaser = null;
      }
    },
  };
})();
