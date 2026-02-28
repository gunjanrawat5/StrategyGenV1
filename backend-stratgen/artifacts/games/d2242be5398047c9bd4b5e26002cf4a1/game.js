(function () {
  'use strict';
  const PLAN = {"title": "Turbo Drift Survival", "genre": "Arcade Survival", "core_loop": "Steer through traffic, dodge oncoming cars, and survive to increase your score.", "controls": ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "R"], "mechanics": ["dodge", "survive"], "player": {"speed": 320.0, "radius": 18, "color": "#00ffcc", "health": 1}, "enemy_archetypes": [{"id": "traffic_car", "movement": "fall", "speed": 280.0, "radius": 18, "color": "#ff4444", "count": 8}], "player_rules": ["Player movement is 4-directional using arrow keys.", "Player collision with any traffic car causes immediate loss."], "enemy_rules": ["Traffic cars descend from the top of the screen to the bottom.", "Traffic cars respawn at the top with a random horizontal position after exiting the viewport."], "physics_rules": {"gravity": 0.0, "max_speed": 500.0, "friction": 0.0}, "win_condition": "Reach a score of 50.", "lose_condition": "Collide with any traffic car.", "ui_text": {"title": "Turbo Drift Survival", "hint": "Use Arrow Keys to dodge traffic. Reach 50 points to win! Press R to restart."}, "difficulty": {"enemy_spawn_interval_ms": 500, "enemy_speed": 280.0, "score_per_enemy": 1, "target_score": 50}, "scene_graph_objects": [{"id": "player_car", "kind": "player"}, {"id": "traffic_1", "kind": "enemy"}, {"id": "road_line", "kind": "decoration"}]};
  if (!window.Phaser) throw new Error('Phaser runtime was not loaded.');

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
      super({ key: 'TurboDriftSurvival' });
      this.score = 0;
      this.isGameOver = false;
      this.isWin = false;
    }

    preload() {
      // Create procedural textures
      const graphics = this.make.graphics();

      // Player Car Texture
      graphics.clear();
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(PLAN.player.color).color, 1);
      graphics.fillRoundedRect(0, 0, 32, 48, 8);
      graphics.fillStyle(0x333333, 1); // Windshield
      graphics.fillRect(4, 8, 24, 10);
      graphics.generateTexture('player_car', 32, 48);

      // Enemy Car Texture
      graphics.clear();
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(PLAN.enemy_archetypes[0].color).color, 1);
      graphics.fillRoundedRect(0, 0, 32, 48, 8);
      graphics.fillStyle(0x333333, 1); // Windshield
      graphics.fillRect(4, 30, 24, 10);
      graphics.generateTexture('enemy_car', 32, 48);

      // Road Line Texture
      graphics.clear();
      graphics.fillStyle(0xffffff, 0.5);
      graphics.fillRect(0, 0, 10, 40);
      graphics.generateTexture('road_line', 10, 40);
    }

    create() {
      const { width } = this.scale;
      this.score = 0;
      this.isGameOver = false;
      this.isWin = false;

      // Background
      this.add.rectangle(width / 2, height / 2, width, height, 0x222222);

      // Road Decorations (Moving lines)
      this.roadLines = this.add.group();
      for (let i = 0; i < 10; i++) {
        const line = this.add.sprite(width / 2, i * 100, 'road_line');
        this.roadLines.add(line);
      }

      // Player Setup
      this.player = this.physics.add.sprite(width / 2, height - 100, 'player_car');
      this.player.setCollideWorldBounds(true);
      this.player.body.setCircle(PLAN.player.radius, (32 - PLAN.player.radius * 2) / 2, (48 - PLAN.player.radius * 2) / 2);

      // Enemy Group
      this.enemies = this.physics.add.group();
      const enemyData = PLAN.enemy_archetypes[0];
      for (let i = 0; i < enemyData.count; i++) {
        this.spawnEnemy(true);
      }

      // Collisions
      this.physics.add.overlap(this.player, this.enemies, this.handleCollision, null, this);

      // Controls
      this.cursors = this.input.keyboard.createCursorKeys();
      this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

      // UI
      this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' });
      this.hintText = this.add.text(width / 2, height - 30, PLAN.ui_text.hint, { fontSize: '14px', fill: '#aaa' }).setOrigin(0.5);
      
      this.statusText = this.add.text(width / 2, height / 2, '', { fontSize: '48px', fill: '#fff', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
      this.statusText.setVisible(false);
    }

    spawnEnemy(initial = false) {
      const { width } = this.scale;
      const enemyData = PLAN.enemy_archetypes[0];
      const x = Phaser.Math.Between(50, width - 50);
      const y = initial ? Phaser.Math.Between(-height, 0) : -50;
      
      let enemy = this.enemies.getFirstDead();
      if (!enemy) {
        enemy = this.enemies.create(x, y, 'enemy_car');
      } else {
        enemy.setActive(true);
        enemy.setVisible(true);
        enemy.setPosition(x, y);
      }
      
      enemy.body.setCircle(enemyData.radius, (32 - enemyData.radius * 2) / 2, (48 - enemyData.radius * 2) / 2);
      enemy.setVelocityY(enemyData.speed);
    }

    handleCollision(player, enemy) {
      if (this.isGameOver || this.isWin) return;
      this.isGameOver = true;
      this.physics.pause();
      this.player.setTint(0xff0000);
      this.statusText.setText('GAME OVER\nPress R to Restart').setVisible(true);
    }

    handleWin() {
      if (this.isWin || this.isGameOver) return;
      this.isWin = true;
      this.physics.pause();
      this.statusText.setText('YOU WIN!\nScore: ' + this.score + '\nPress R to Restart').setFill('#00ffcc').setVisible(true);
    }

    update() {
      if (this.restartKey.isDown) {
        this.scene.restart();
      }

      if (this.isGameOver || this.isWin) return;

      // Player Movement
      const speed = PLAN.player.speed;
      this.player.setVelocity(0);

      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-speed);
        this.player.setAngle(-10);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(speed);
        this.player.setAngle(10);
      } else {
        this.player.setAngle(0);
      }

      if (this.cursors.up.isDown) {
        this.player.setVelocityY(-speed);
      } else if (this.cursors.down.isDown) {
        this.player.setVelocityY(speed);
      }

      // Road Animation
      this.roadLines.children.iterate((line) => {
        line.y += 5;
        if (line.y > this.scale.height) {
          line.y = -40;
        }
      });

      // Enemy Recycling and Scoring
      this.enemies.children.iterate((enemy) => {
        if (enemy.active && enemy.y > this.scale.height) {
          enemy.y = -50;
          enemy.x = Phaser.Math.Between(50, this.scale.width - 50);
          this.score += PLAN.difficulty.score_per_enemy;
          this.scoreText.setText('Score: ' + this.score);

          if (this.score >= PLAN.difficulty.target_score) {
            this.handleWin();
          }
        }
      });
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


