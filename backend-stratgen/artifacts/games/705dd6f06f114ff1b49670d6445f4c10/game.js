(function () {
  'use strict';
  const PLAN = {"title": "Neon Void Dodger", "genre": "Arcade Survival", "core_loop": "Navigate the player to avoid falling hazards, surviving long enough to accumulate the target score.", "controls": ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "R"], "mechanics": ["dodge", "survive"], "player": {"speed": 320.0, "radius": 14, "color": "#00ffcc", "health": 1}, "enemy_archetypes": [{"id": "void_orb", "movement": "fall", "speed": 180.0, "radius": 12, "color": "#ff0055", "count": 12}], "player_rules": ["The player can move freely in four directions within the screen bounds.", "Any contact with an enemy results in an immediate game over."], "enemy_rules": ["Enemies spawn at random horizontal positions above the top edge.", "Enemies travel vertically downwards at a constant speed.", "Enemies wrap back to the top once they pass the bottom edge."], "physics_rules": {"gravity": 0.0, "max_speed": 400.0, "friction": 0.0}, "win_condition": "Survive until the score reaches 50.", "lose_condition": "Collision with any red void orb.", "ui_text": {"title": "Neon Void Dodger", "hint": "Use Arrow Keys to dodge the red orbs. Reach 50 points to win!", "game_over": "Game Over! Press R to restart."}, "difficulty": {"enemy_spawn_interval_ms": 400, "enemy_speed": 180.0, "score_per_enemy": 1, "target_score": 50}, "scene_graph_objects": [{"id": "player_unit", "kind": "player"}, {"id": "hazard_1", "kind": "enemy"}, {"id": "background_glow", "kind": "decoration"}]};
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
      super({ key: 'NeonVoidDodgerScene' });
      this.score = 0;
      this.isGameOver = false;
      this.isWin = false;
    }

    init() {
      this.score = 0;
      this.isGameOver = false;
      this.isWin = false;
    }

    preload() {
      // Generate procedural textures
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });

      // Player texture
      graphics.clear();
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(PLAN.player.color).color, 1);
      graphics.fillCircle(PLAN.player.radius, PLAN.player.radius, PLAN.player.radius);
      graphics.lineStyle(2, 0xffffff, 0.8);
      graphics.strokeCircle(PLAN.player.radius, PLAN.player.radius, PLAN.player.radius);
      graphics.generateTexture('player_tex', PLAN.player.radius * 2, PLAN.player.radius * 2);

      // Enemy texture
      const enemyArchetype = PLAN.enemy_archetypes[0];
      graphics.clear();
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(enemyArchetype.color).color, 1);
      graphics.fillCircle(enemyArchetype.radius, enemyArchetype.radius, enemyArchetype.radius);
      graphics.lineStyle(2, 0xffffff, 0.5);
      graphics.strokeCircle(enemyArchetype.radius, enemyArchetype.radius, enemyArchetype.radius);
      graphics.generateTexture('enemy_tex', enemyArchetype.radius * 2, enemyArchetype.radius * 2);
    }

    create() {
      const { width, height } = this.scale;

      // Background decoration
      const bg = this.add.graphics();
      bg.lineStyle(1, 0x333333, 0.5);
      for (let i = 0; i < width; i += 40) {
        bg.moveTo(i, 0);
        bg.lineTo(i, height);
      }
      for (let j = 0; j < height; j += 40) {
        bg.moveTo(0, j);
        bg.lineTo(width, j);
      }
      bg.strokePath();

      // Player setup
      this.player = this.physics.add.sprite(width / 2, height - 100, 'player_tex');
      this.player.setCollideWorldBounds(true);
      this.player.setCircle(PLAN.player.radius);

      // Enemy group setup
      const enemyArchetype = PLAN.enemy_archetypes[0];
      this.enemies = this.physics.add.group({
        key: 'enemy_tex',
        repeat: enemyArchetype.count - 1,
        setXY: { x: 0, y: -100 }
      });

      this.enemies.children.iterate((enemy) => {
        this.resetEnemy(enemy);
      });

      // UI
      this.scoreText = this.add.text(20, 20, `Score: 0 / ${PLAN.difficulty.target_score}`, {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'Arial'
      });

      this.hintText = this.add.text(width / 2, height - 30, PLAN.ui_text.hint, {
        fontSize: '14px',
        fill: '#aaaaaa',
        fontFamily: 'Arial'
      }).setOrigin(0.5);

      this.statusText = this.add.text(width / 2, height / 2, '', {
        fontSize: '32px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        align: 'center'
      }).setOrigin(0.5).setVisible(false);

      // Controls
      this.cursors = this.input.keyboard.createCursorKeys();
      this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

      // Collisions
      this.physics.add.overlap(this.player, this.enemies, this.handleCollision, null, this);
    }

    update() {
      if (this.isGameOver || this.isWin) {
        this.player.setVelocity(0, 0);
        if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
          this.scene.restart();
        }
        return;
      }

      this.handlePlayerMovement();
      this.handleEnemyLogic();
      this.checkWinCondition();
    }

    handlePlayerMovement() {
      const speed = PLAN.player.speed;
      this.player.setVelocity(0, 0);

      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-speed);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(speed);
      }

      if (this.cursors.up.isDown) {
        this.player.setVelocityY(-speed);
      } else if (this.cursors.down.isDown) {
        this.player.setVelocityY(speed);
      }
    }

    handleEnemyLogic() {
      const { height } = this.scale;
      const enemySpeed = PLAN.difficulty.enemy_speed;

      this.enemies.children.iterate((enemy) => {
        enemy.setVelocityY(enemySpeed);

        // Wrap logic
        if (enemy.y > height + 20) {
          this.resetEnemy(enemy);
          this.score += PLAN.difficulty.score_per_enemy;
          this.scoreText.setText(`Score: ${this.score} / ${PLAN.difficulty.target_score}`);
        }
      });
    }

    resetEnemy(enemy) {
      const { width } = this.scale;
      const x = Phaser.Math.Between(20, width - 20);
      const y = Phaser.Math.Between(-600, -50);
      enemy.setPosition(x, y);
      enemy.setCircle(PLAN.enemy_archetypes[0].radius);
    }

    handleCollision(player, enemy) {
      this.isGameOver = true;
      this.physics.pause();
      player.setTint(0xff0000);
      this.statusText.setText(PLAN.ui_text.game_over).setVisible(true);
    }

    checkWinCondition() {
      if (this.score >= PLAN.difficulty.target_score) {
        this.isWin = true;
        this.physics.pause();
        this.statusText.setText(`VICTORY!\nScore: ${this.score}\nPress R to Play Again`).setVisible(true);
        this.statusText.setFill('#00ffcc');
      }
    }
  };
}

// Note: The scaffold will call createGeneratedScene(Phaser, PLAN) and handle the scene lifecycle.
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
