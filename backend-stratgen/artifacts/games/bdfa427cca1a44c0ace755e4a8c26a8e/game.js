(function () {
  'use strict';
  const PLAN = {"title": "Pro Dribbler", "genre": "Arcade Sports", "core_loop": "Dribble the ball past incoming defenders to score points and survive.", "controls": ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "R"], "mechanics": ["dodge", "survive"], "player": {"speed": 300.0, "radius": 15, "color": "#ffffff", "health": 1}, "enemy_archetypes": [{"id": "defender", "movement": "fall", "speed": 180.0, "radius": 20, "color": "#e63946", "count": 8}], "player_rules": ["Player moves in 4 directions using arrow keys.", "Collision with a defender results in an immediate game over."], "enemy_rules": ["Defenders move from the top of the screen to the bottom.", "Defenders respawn at the top with a random horizontal position once they leave the screen."], "physics_rules": {"gravity": 0.0, "max_speed": 400.0, "friction": 0.1}, "win_condition": "Reach a score of 50 points.", "lose_condition": "Collide with any defender.", "ui_text": {"title": "Pro Dribbler", "hint": "Dodge the red defenders! Use Arrow Keys to move and R to restart."}, "difficulty": {"enemy_spawn_interval_ms": 600, "enemy_speed": 180.0, "score_per_enemy": 1, "target_score": 50}, "scene_graph_objects": [{"id": "ball", "kind": "player"}, {"id": "defender_unit", "kind": "enemy"}, {"id": "pitch_lines", "kind": "decoration"}]};
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
      super({ key: 'ProDribblerScene' });
    }

    init() {
      this.score = 0;
      this.isGameOver = false;
      this.isWin = false;
    }

    preload() {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });

      // Player Ball Texture
      graphics.clear();
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(PLAN.player.color).color, 1);
      graphics.fillCircle(PLAN.player.radius, PLAN.player.radius, PLAN.player.radius);
      graphics.lineStyle(2, 0x000000, 0.5);
      graphics.strokeCircle(PLAN.player.radius, PLAN.player.radius, PLAN.player.radius);
      graphics.generateTexture('ball', PLAN.player.radius * 2, PLAN.player.radius * 2);

      // Defender Texture
      const def = PLAN.enemy_archetypes[0];
      graphics.clear();
      graphics.fillStyle(Phaser.Display.Color.HexStringToColor(def.color).color, 1);
      graphics.fillCircle(def.radius, def.radius, def.radius);
      graphics.lineStyle(2, 0x000000, 0.5);
      graphics.strokeCircle(def.radius, def.radius, def.radius);
      graphics.generateTexture('defender', def.radius * 2, def.radius * 2);
    }

    create() {
      const { width, height } = this.scale;

      // Draw Pitch Lines (Decoration)
      const pitch = this.add.graphics();
      pitch.lineStyle(2, 0xffffff, 0.2);
      pitch.strokeRect(20, 20, width - 40, height - 40);
      pitch.lineBetween(20, height / 2, width - 20, height / 2);
      pitch.strokeCircle(width / 2, height / 2, 60);

      // Player
      this.player = this.physics.add.sprite(width / 2, height - 100, 'ball');
      this.player.setCollideWorldBounds(true);
      this.player.setCircle(PLAN.player.radius);

      // Defenders Group
      this.defenders = this.physics.add.group();
      const defData = PLAN.enemy_archetypes[0];
      for (let i = 0; i < defData.count; i++) {
        this.spawnDefender(true);
      }

      // Input
      this.cursors = this.input.keyboard.createCursorKeys();
      this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

      // UI
      this.scoreText = this.add.text(20, 20, `Score: 0 / ${PLAN.difficulty.target_score}`, {
        fontSize: '24px',
        fill: '#fff',
        fontStyle: 'bold'
      });
      
      this.hintText = this.add.text(width / 2, height - 30, PLAN.ui_text.hint, {
        fontSize: '14px',
        fill: '#fff'
      }).setOrigin(0.5);

      this.statusText = this.add.text(width / 2, height / 2, '', {
        fontSize: '48px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6
      }).setOrigin(0.5);

      // Collisions
      this.physics.add.overlap(this.player, this.defenders, this.handleCollision, null, this);
    }

    spawnDefender(initial = false) {
      const defData = PLAN.enemy_archetypes[0];
      const x = Phaser.Math.Between(defData.radius, this.scale.width - defData.radius);
      const y = initial ? Phaser.Math.Between(-this.scale.height, 0) : -defData.radius * 2;
      
      let defender = this.defenders.getFirstDead();
      if (!defender) {
        defender = this.defenders.create(x, y, 'defender');
      } else {
        defender.enableBody(true, x, y, true, true);
      }
      
      defender.setCircle(defData.radius);
      defender.setVelocityY(defData.speed);
    }

    handleCollision() {
      if (this.isGameOver || this.isWin) return;
      this.isGameOver = true;
      this.physics.pause();
      this.player.setTint(0xff0000);
      this.statusText.setText('GAME OVER');
    }

    update() {
      if (this.isGameOver || this.isWin) {
        if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
          this.scene.restart();
        }
        return;
      }

      // Player Movement
      const speed = PLAN.player.speed;
      this.player.setVelocity(0);

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

      // Defender Recycling and Scoring
      this.defenders.children.iterate((defender) => {
        if (defender.y > this.scale.height + defender.displayHeight) {
          this.score += PLAN.difficulty.score_per_enemy;
          this.scoreText.setText(`Score: ${this.score} / ${PLAN.difficulty.target_score}`);
          
          // Reset defender to top
          const defData = PLAN.enemy_archetypes[0];
          defender.x = Phaser.Math.Between(defData.radius, this.scale.width - defData.radius);
          defender.y = -defData.radius * 2;

          // Check Win Condition
          if (this.score >= PLAN.difficulty.target_score) {
            this.isWin = true;
            this.physics.pause();
            this.statusText.setText('YOU WIN!');
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
