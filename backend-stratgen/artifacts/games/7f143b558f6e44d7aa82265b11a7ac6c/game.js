(function () {
  'use strict';
  const PLAN = {"title": "Grid Tactician", "genre": "Arcade Strategy", "core_loop": "Plan movement to collect energy nodes while managing the positions of pursuing sentries.", "controls": ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"], "mechanics": ["dodge", "collect", "survive"], "player": {"speed": 220.0, "radius": 15, "color": "#00ff88", "health": 1}, "enemy_archetypes": [{"id": "sentry", "movement": "chase", "speed": 90.0, "radius": 12, "color": "#ff3333", "count": 5}], "player_rules": ["Player moves in 4 directions to reach energy nodes.", "Collecting a node increases score and triggers a new node spawn.", "Touching a sentry results in immediate game over."], "enemy_rules": ["Sentries track the player's current coordinates continuously.", "Sentries spawn at the screen boundaries every few seconds."], "physics_rules": {"gravity": 0.0, "max_speed": 400.0, "friction": 0.1}, "win_condition": "Collect enough nodes to reach a score of 50.", "lose_condition": "Collision with any red sentry unit.", "ui_text": {"title": "Grid Tactician", "hint": "Use Arrow Keys to move. Collect green nodes and avoid red sentries."}, "difficulty": {"enemy_spawn_interval_ms": 1500, "enemy_speed": 90.0, "score_per_enemy": 5, "target_score": 50}, "scene_graph_objects": [{"id": "player", "kind": "player"}, {"id": "sentry_unit", "kind": "enemy"}, {"id": "energy_node", "kind": "pickup"}]};
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
      super({ key: 'GridTacticianScene' });
      this.score = 0;
      this.isGameOver = false;
      this.isWin = false;
    }

    preload() {
      // Generate procedural textures
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });

      // Player texture
      graphics.clear();
      graphics.fillStyle(parseInt(PLAN.player.color.replace('#', '0x'), 16));
      graphics.fillCircle(PLAN.player.radius, PLAN.player.radius, PLAN.player.radius);
      graphics.generateTexture('player_tex', PLAN.player.radius * 2, PLAN.player.radius * 2);

      // Sentry texture
      graphics.clear();
      graphics.fillStyle(parseInt(PLAN.enemy_archetypes[0].color.replace('#', '0x'), 16));
      graphics.fillCircle(PLAN.enemy_archetypes[0].radius, PLAN.enemy_archetypes[0].radius, PLAN.enemy_archetypes[0].radius);
      graphics.generateTexture('sentry_tex', PLAN.enemy_archetypes[0].radius * 2, PLAN.enemy_archetypes[0].radius * 2);

      // Node texture
      graphics.clear();
      graphics.fillStyle(0xffff00); // Energy node color
      graphics.fillCircle(10, 10, 10);
      graphics.generateTexture('node_tex', 20, 20);
    }

    create() {
      const { width, height } = this.scale;
      this.score = 0;
      this.isGameOver = false;
      this.isWin = false;

      // Background grid
      const grid = this.add.graphics();
      grid.lineStyle(1, 0x333333, 0.5);
      for (let x = 0; x < width; x += 40) {
        grid.moveTo(x, 0);
        grid.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 40) {
        grid.moveTo(0, y);
        grid.lineTo(width, y);
      }
      grid.strokePath();

      // Player setup
      this.player = this.physics.add.sprite(width / 2, height / 2, 'player_tex');
      this.player.setCollideWorldBounds(true);
      this.player.setDrag(PLAN.physics_rules.friction * 1000);
      this.player.setMaxVelocity(PLAN.physics_rules.max_speed);

      // Groups
      this.enemies = this.physics.add.group();
      this.nodes = this.physics.add.group();

      // Initial Node
      this.spawnNode();

      // UI
      this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', fill: '#fff', fontFamily: 'Arial' });
      this.hintText = this.add.text(width / 2, height - 30, PLAN.ui_text.hint, { fontSize: '14px', fill: '#aaa', fontFamily: 'Arial' }).setOrigin(0.5);
      
      this.statusText = this.add.text(width / 2, height / 2, '', { fontSize: '48px', fill: '#fff', fontWeight: 'bold', fontFamily: 'Arial' }).setOrigin(0.5);

      // Controls
      this.cursors = this.input.keyboard.createCursorKeys();

      // Enemy Spawning Timer
      this.spawnTimer = this.time.addEvent({
        delay: PLAN.difficulty.enemy_spawn_interval_ms,
        callback: this.spawnSentry,
        callbackScope: this,
        loop: true
      });

      // Collisions
      this.physics.add.overlap(this.player, this.nodes, this.collectNode, null, this);
      this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
    }

    update() {
      if (this.isGameOver || this.isWin) {
        this.player.setVelocity(0);
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

      // Enemy AI (Chase)
      this.enemies.getChildren().forEach((enemy) => {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const enemySpeed = PLAN.difficulty.enemy_speed;
        enemy.body.setVelocity(
          Math.cos(angle) * enemySpeed,
          Math.sin(angle) * enemySpeed
        );
      });

      // Win Condition Check
      if (this.score >= PLAN.difficulty.target_score && !this.isWin) {
        this.winGame();
      }
    }

    spawnNode() {
      const x = Phaser.Math.Between(50, this.scale.width - 50);
      const y = Phaser.Math.Between(50, this.scale.height - 50);
      
      if (this.activeNode) {
        this.activeNode.setPosition(x, y);
      } else {
        this.activeNode = this.nodes.create(x, y, 'node_tex');
      }
      
      // Visual pulse for node
      this.tweens.add({
        targets: this.activeNode,
        scale: 1.2,
        duration: 400,
        yoyo: true,
        repeat: -1
      });
    }

    spawnSentry() {
      if (this.isGameOver || this.isWin) return;

      const { width, height } = this.scale;
      let x, y;

      // Spawn at random boundary
      const side = Phaser.Math.Between(0, 3);
      if (side === 0) { x = Phaser.Math.Between(0, width); y = -20; } // Top
      else if (side === 1) { x = Phaser.Math.Between(0, width); y = height + 20; } // Bottom
      else if (side === 2) { x = -20; y = Phaser.Math.Between(0, height); } // Left
      else { x = width + 20; y = Phaser.Math.Between(0, height); } // Right

      const sentry = this.enemies.create(x, y, 'sentry_tex');
      sentry.setCollideWorldBounds(false);
    }

    collectNode(player, node) {
      this.score += 5;
      this.scoreText.setText(`Score: ${this.score}`);
      
      // Flash effect
      this.cameras.main.flash(100, 0, 255, 136, 0.2);
      
      this.spawnNode();
    }

    hitEnemy(player, enemy) {
      this.isGameOver = true;
      this.physics.pause();
      this.player.setTint(0xff0000);
      this.statusText.setText('GAME OVER');
      this.statusText.setFill('#ff3333');
      this.spawnTimer.remove();
      
      this.time.delayedCall(2000, () => {
        this.scene.restart();
      });
    }

    winGame() {
      this.isWin = true;
      this.physics.pause();
      this.statusText.setText('VICTORY!');
      this.statusText.setFill('#00ff88');
      this.spawnTimer.remove();

      this.time.delayedCall(3000, () => {
        this.scene.restart();
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
