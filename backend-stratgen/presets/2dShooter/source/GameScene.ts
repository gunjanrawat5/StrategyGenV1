import Phaser from 'phaser'
import { connectToServer, sendToServer, type ServerMessage } from '../network/client'

type Slot = 1 | 2

export default class GameScene extends Phaser.Scene {
  private ducks!: Record<Slot, Phaser.Physics.Arcade.Sprite>
  private obstacles!: Phaser.Physics.Arcade.StaticGroup
  private localProjectiles!: Phaser.Physics.Arcade.Group
  private remoteProjectiles!: Phaser.Physics.Arcade.Group

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private shootUpKey!: Phaser.Input.Keyboard.Key
  private shootLeftKey!: Phaser.Input.Keyboard.Key
  private shootDownKey!: Phaser.Input.Keyboard.Key
  private shootRightKey!: Phaser.Input.Keyboard.Key

  private localSlot: Slot | null = null
  private connected: Record<Slot, boolean> = { 1: false, 2: false }
  private healthBySlot: Record<Slot, number> = { 1: 100, 2: 100 }
  private remoteTargets: Record<Slot, { x: number, y: number, moving: boolean, flipX: boolean }> = {
    1: { x: 384, y: 576, moving: false, flipX: false },
    2: { x: 504, y: 456, moving: false, flipX: false }
  }

  private readonly maxHealth = 100
  private readonly shotCooldownMs = 220
  private readonly stateSendMs = 50
  private lastShotAt = 0
  private lastStateSentAt = 0
  private shootDir = new Phaser.Math.Vector2(1, 0)

  private healthBars!: Record<Slot, Phaser.GameObjects.Graphics>
  private healthText!: Phaser.GameObjects.Text
  private statusText!: Phaser.GameObjects.Text

  private ws?: WebSocket
  private worldWidth = 0
  private worldHeight = 0

  constructor() {
    super({ key: 'GameScene' })
  }

  preload() {
    this.load.spritesheet('ducky2', 'src/assets/ducky_2_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32
    })
    this.load.spritesheet('ducky3', 'src/assets/ducky_3_spritesheet.png', {
      frameWidth: 32,
      frameHeight: 32
    })
  }

  private slotTexture(slot: Slot): 'ducky2' | 'ducky3' {
    return slot === 1 ? 'ducky3' : 'ducky2'
  }

  private slotAnimPrefix(slot: Slot): 'duck2' | 'duck3' {
    return slot === 1 ? 'duck3' : 'duck2'
  }

  private otherSlot(slot: Slot): Slot {
    return slot === 1 ? 2 : 1
  }

  private spawnFor(slot: Slot) {
    if (slot === 1) {
      return { x: 384, y: 576 }
    }
    return { x: 504, y: 456 }
  }

  private createDuckSet(textureKey: 'ducky2' | 'ducky3', prefix: 'duck2' | 'duck3') {
    if (!this.anims.exists(`${prefix}-idle`)) {
      this.anims.create({
        key: `${prefix}-idle`,
        frames: this.anims.generateFrameNumbers(textureKey, { frames: [0, 1] }),
        frameRate: 2,
        repeat: -1
      })
    }

    if (!this.anims.exists(`${prefix}-walk`)) {
      this.anims.create({
        key: `${prefix}-walk`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 6, end: 11 }),
        frameRate: 10,
        repeat: -1
      })
    }

    if (!this.anims.exists(`${prefix}-peck`)) {
      this.anims.create({
        key: `${prefix}-peck`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 12, end: 15 }),
        frameRate: 8,
        repeat: -1
      })
    }

    if (!this.anims.exists(`${prefix}-run`)) {
      this.anims.create({
        key: `${prefix}-run`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 18, end: 23 }),
        frameRate: 12,
        repeat: -1
      })
    }
  }

  private createDuckyAnimations() {
    this.createDuckSet('ducky3', 'duck3')
    this.createDuckSet('ducky2', 'duck2')
  }

  private createTextures() {
    if (!this.textures.exists('ground-grass')) {
      const g = this.add.graphics()

      g.fillStyle(0x70b63a, 1)
      g.fillRect(0, 0, 64, 64)
      g.fillStyle(0x5ca02f, 1)
      for (let i = 0; i < 20; i += 1) {
        g.fillCircle(Phaser.Math.Between(0, 64), Phaser.Math.Between(0, 64), Phaser.Math.Between(1, 3))
      }
      g.generateTexture('ground-grass', 64, 64)
      g.clear()

      g.fillStyle(0xcfb16b, 1)
      g.fillRect(0, 0, 64, 64)
      g.fillStyle(0xb99655, 1)
      for (let i = 0; i < 18; i += 1) {
        g.fillCircle(Phaser.Math.Between(0, 64), Phaser.Math.Between(0, 64), Phaser.Math.Between(1, 3))
      }
      g.generateTexture('ground-path', 64, 64)
      g.clear()

      g.fillStyle(0x6e7075, 1)
      g.fillRect(0, 0, 64, 64)
      g.lineStyle(2, 0xb8b8ba, 1)
      g.strokeRect(2, 2, 60, 60)
      g.lineStyle(1, 0x45484d, 1)
      g.strokeLineShape(new Phaser.Geom.Line(32, 2, 32, 62))
      g.strokeLineShape(new Phaser.Geom.Line(2, 32, 62, 32))
      g.generateTexture('wall', 64, 64)
      g.clear()

      g.fillStyle(0x5d3924, 1)
      g.fillRoundedRect(6, 10, 52, 48, 8)
      g.fillStyle(0xd79b4a, 1)
      g.fillRoundedRect(10, 4, 44, 20, 6)
      g.lineStyle(2, 0x3c2417, 1)
      g.strokeRoundedRect(6, 10, 52, 48, 8)
      g.generateTexture('crate', 64, 64)
      g.clear()

      g.fillStyle(0x7f5f2c, 1)
      g.fillCircle(32, 32, 26)
      g.lineStyle(4, 0x5a3f19, 1)
      g.strokeCircle(32, 32, 24)
      g.fillStyle(0xd64d3f, 1)
      g.fillCircle(32, 20, 12)
      g.generateTexture('barrel', 64, 64)
      g.clear()

      g.fillStyle(0x31762c, 1)
      g.fillCircle(32, 32, 27)
      g.fillStyle(0x3e8f36, 1)
      g.fillCircle(24, 30, 16)
      g.fillCircle(40, 36, 14)
      g.generateTexture('bush', 64, 64)
      g.clear()

      g.fillStyle(0x1f5e27, 1)
      g.fillCircle(32, 32, 30)
      g.fillStyle(0x2e7a30, 1)
      g.fillCircle(20, 24, 16)
      g.fillCircle(44, 26, 15)
      g.fillCircle(24, 44, 15)
      g.fillCircle(44, 44, 14)
      g.generateTexture('tree', 64, 64)
      g.clear()

      g.fillStyle(0xff8f1f, 1)
      g.fillCircle(10, 10, 10)
      g.fillStyle(0xffe26a, 0.95)
      g.fillCircle(7, 8, 5)
      g.generateTexture('fireball', 20, 20)
      g.clear()

      g.destroy()
    }
  }

  private drawHealthBar(bar: Phaser.GameObjects.Graphics, target: Phaser.Physics.Arcade.Sprite, health: number, fillColor: number) {
    const width = 44
    const height = 7
    const x = target.x - width / 2
    const y = target.y - 36
    const hpRatio = Phaser.Math.Clamp(health / this.maxHealth, 0, 1)

    bar.clear()
    bar.fillStyle(0x111111, 0.85)
    bar.fillRoundedRect(x - 1, y - 1, width + 2, height + 2, 3)
    bar.fillStyle(0x4f1a1a, 1)
    bar.fillRoundedRect(x, y, width, height, 2)
    bar.fillStyle(fillColor, 1)
    bar.fillRoundedRect(x, y, width * hpRatio, height, 2)
  }

  private playHitFlash(target: Phaser.Physics.Arcade.Sprite) {
    this.tweens.killTweensOf(target)
    target.setVisible(true)
    target.setAlpha(1)
    target.setTintFill(0xffffff)

    this.tweens.add({
      targets: target,
      alpha: { from: 1, to: 0.45 },
      yoyo: true,
      repeat: 4,
      duration: 50,
      onComplete: () => {
        target.setAlpha(1)
        target.clearTint()
        target.setVisible(true)
      }
    })
  }

  private despawnProjectile(projectile: Phaser.Physics.Arcade.Image) {
    projectile.body.stop()
    projectile.disableBody(true, true)
  }

  private isFireball(obj: Phaser.GameObjects.GameObject): obj is Phaser.Physics.Arcade.Image {
    if (!(obj instanceof Phaser.Physics.Arcade.Image)) {
      return false
    }
    if (obj.texture?.key !== 'fireball') {
      return false
    }
    const owner = obj.getData('ownerSlot')
    return owner === 1 || owner === 2
  }

  private extractFireball(
    a: Phaser.GameObjects.GameObject,
    b?: Phaser.GameObjects.GameObject
  ): Phaser.Physics.Arcade.Image | null {
    if (this.isFireball(a)) {
      return a
    }
    if (b && this.isFireball(b)) {
      return b
    }
    return null
  }

  private spawnProjectile(group: Phaser.Physics.Arcade.Group, ownerSlot: Slot, x: number, y: number, dx: number, dy: number) {
    const dir = new Phaser.Math.Vector2(dx, dy)
    if (dir.lengthSq() === 0) {
      return
    }
    dir.normalize()

    const projectile = group.get(x + dir.x * 20, y + dir.y * 20, 'fireball') as Phaser.Physics.Arcade.Image | null
    if (!projectile) {
      return
    }

    projectile.enableBody(true, x + dir.x * 20, y + dir.y * 20, true, true)
    projectile.setScale(1)
    projectile.setDepth(3)
    projectile.body.setAllowGravity(false)
    projectile.body.setVelocity(dir.x * 480, dir.y * 480)
    projectile.setData('expiresAt', this.time.now + 900)
    projectile.setData('ownerSlot', ownerSlot)
  }

  private tryShootLocal(dx: number, dy: number) {
    if (!this.localSlot) {
      return
    }

    const now = this.time.now
    if (now - this.lastShotAt < this.shotCooldownMs) {
      return
    }

    const localDuck = this.ducks[this.localSlot]
    this.spawnProjectile(this.localProjectiles, this.localSlot, localDuck.x, localDuck.y, dx, dy)
    sendToServer(this.ws, {
      type: 'shoot',
      x: localDuck.x,
      y: localDuck.y,
      dx,
      dy
    })
    this.lastShotAt = now
  }

  private placeLine(startX: number, startY: number, count: number, horizontal: boolean, key: 'wall' | 'crate' | 'barrel') {
    for (let i = 0; i < count; i += 1) {
      const x = startX + (horizontal ? i : 0)
      const y = startY + (horizontal ? 0 : i)
      const obj = this.obstacles.create(x * 64 + 32, y * 64 + 32, key) as Phaser.Physics.Arcade.Sprite
      obj.setOrigin(0.5)
    }
  }

  private drawGround(cols: number, rows: number) {
    const pathTiles = new Set<string>()
    const addPathRect = (x0: number, y0: number, w: number, h: number) => {
      for (let y = y0; y < y0 + h; y += 1) {
        for (let x = x0; x < x0 + w; x += 1) {
          pathTiles.add(`${x},${y}`)
        }
      }
    }

    addPathRect(5, 0, 2, 18)
    addPathRect(0, 5, 12, 2)
    addPathRect(0, 11, 12, 2)
    addPathRect(2, 3, 8, 2)
    addPathRect(2, 14, 8, 2)

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const key = pathTiles.has(`${x},${y}`) ? 'ground-path' : 'ground-grass'
        this.add.image(x * 64 + 32, y * 64 + 32, key).setDepth(-10)
      }
    }
  }

  private placeTrees(cols: number, rows: number) {
    for (let x = 0; x < cols; x += 1) {
      this.add.image(x * 64 + 32, 32, 'tree').setDepth(2)
      this.add.image(x * 64 + 32, rows * 64 - 32, 'tree').setDepth(2)
    }
    for (let y = 1; y < rows - 1; y += 1) {
      this.add.image(32, y * 64 + 32, 'tree').setDepth(2)
      this.add.image(cols * 64 - 32, y * 64 + 32, 'tree').setDepth(2)
    }
  }

  private setupDucks() {
    const s1 = this.spawnFor(1)
    const s2 = this.spawnFor(2)

    const duck1 = this.physics.add.sprite(s1.x, s1.y, 'ducky3', 0)
    const duck2 = this.physics.add.sprite(s2.x, s2.y, 'ducky2', 0)

    ;[duck1, duck2].forEach((duck) => {
      duck.setScale(1.6)
      const body = duck.body as Phaser.Physics.Arcade.Body
      body.setSize(20, 18)
      body.setOffset(6, 12)
      body.setCollideWorldBounds(true)
      body.setDrag(600, 600)
      body.setMaxSpeed(280)
    })

    this.ducks = {
      1: duck1,
      2: duck2
    }
    this.remoteTargets[1] = { x: s1.x, y: s1.y, moving: false, flipX: false }
    this.remoteTargets[2] = { x: s2.x, y: s2.y, moving: false, flipX: false }

    this.ducks[1].play('duck3-idle')
    this.ducks[2].play('duck2-idle')

    this.physics.add.collider(this.ducks[1], this.obstacles)
    this.physics.add.collider(this.ducks[2], this.obstacles)
    this.physics.add.collider(this.ducks[1], this.ducks[2])
  }

  private setupProjectiles() {
    this.localProjectiles = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 40 })
    this.remoteProjectiles = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 40 })

    this.physics.add.collider(this.localProjectiles, this.obstacles, (a, b) => {
      const projectile = this.extractFireball(a, b)
      if (!projectile || !projectile.active) return
      this.despawnProjectile(projectile)
    })
    this.physics.add.collider(this.remoteProjectiles, this.obstacles, (a, b) => {
      const projectile = this.extractFireball(a, b)
      if (!projectile || !projectile.active) return
      this.despawnProjectile(projectile)
    })

    this.physics.add.overlap(this.localProjectiles, this.ducks[1], (a, b) => {
      if (!this.localSlot) return
      const targetSlot: Slot = 1
      if (targetSlot === this.localSlot) return
      const projectile = this.extractFireball(a, b)
      if (!projectile || !projectile.active) return
      this.despawnProjectile(projectile)
      sendToServer(this.ws, { type: 'hit', targetSlot })
    })

    this.physics.add.overlap(this.localProjectiles, this.ducks[2], (a, b) => {
      if (!this.localSlot) return
      const targetSlot: Slot = 2
      if (targetSlot === this.localSlot) return
      const projectile = this.extractFireball(a, b)
      if (!projectile || !projectile.active) return
      this.despawnProjectile(projectile)
      sendToServer(this.ws, { type: 'hit', targetSlot })
    })

    this.physics.add.overlap(this.remoteProjectiles, this.ducks[1], (a, b) => {
      if (this.localSlot !== 1) return
      const projectile = this.extractFireball(a, b)
      if (!projectile || !projectile.active) return
      this.despawnProjectile(projectile)
    })
    this.physics.add.overlap(this.remoteProjectiles, this.ducks[2], (a, b) => {
      if (this.localSlot !== 2) return
      const projectile = this.extractFireball(a, b)
      if (!projectile || !projectile.active) return
      this.despawnProjectile(projectile)
    })
  }

  private handleServerMessage(msg: ServerMessage) {
    if (msg.type === 'welcome') {
      this.localSlot = msg.slot
      this.connected[1] = msg.players['1'].connected
      this.connected[2] = msg.players['2'].connected

      this.ducks[1].setPosition(msg.players['1'].x, msg.players['1'].y)
      this.ducks[2].setPosition(msg.players['2'].x, msg.players['2'].y)
      this.ducks[1].setFlipX(msg.players['1'].flipX)
      this.ducks[2].setFlipX(msg.players['2'].flipX)
      this.remoteTargets[1] = {
        x: msg.players['1'].x,
        y: msg.players['1'].y,
        flipX: msg.players['1'].flipX,
        moving: msg.players['1'].moving
      }
      this.remoteTargets[2] = {
        x: msg.players['2'].x,
        y: msg.players['2'].y,
        flipX: msg.players['2'].flipX,
        moving: msg.players['2'].moving
      }

      this.healthBySlot[1] = msg.health['1']
      this.healthBySlot[2] = msg.health['2']

      const localDuck = this.ducks[this.localSlot]
      this.cameras.main.startFollow(localDuck, true, 0.08, 0.08)
      this.statusText.setText(`You are Player ${this.localSlot}`)
      return
    }

    if (msg.type === 'full') {
      this.statusText.setText(msg.message)
      return
    }

    if (msg.type === 'presence') {
      this.connected[1] = msg.players['1'].connected
      this.connected[2] = msg.players['2'].connected

      if (this.localSlot) {
        const other = this.otherSlot(this.localSlot)
        const waitText = this.connected[other] ? `Player ${other} connected` : `Waiting for Player ${other}...`
        this.statusText.setText(`You are Player ${this.localSlot} | ${waitText}`)
      }
      return
    }

    if (msg.type === 'state') {
      const duck = this.ducks[msg.slot]
      this.remoteTargets[msg.slot] = {
        x: msg.x,
        y: msg.y,
        flipX: msg.flipX,
        moving: msg.moving
      }

      // Non-local duck: smooth in update loop instead of snapping here.
      if (this.localSlot && msg.slot !== this.localSlot) {
        duck.setFlipX(msg.flipX)
        return
      }

      duck.setPosition(msg.x, msg.y)
      duck.setFlipX(msg.flipX)

      const prefix = this.slotAnimPrefix(msg.slot)
      const desired = msg.moving ? `${prefix}-walk` : `${prefix}-idle`
      if (duck.anims.currentAnim?.key !== desired) {
        duck.play(desired)
      }
      return
    }

    if (msg.type === 'shoot') {
      if (this.localSlot && msg.slot !== this.localSlot) {
        this.spawnProjectile(this.remoteProjectiles, msg.slot, msg.x, msg.y, msg.dx, msg.dy)
      }
      return
    }

    if (msg.type === 'health') {
      const old1 = this.healthBySlot[1]
      const old2 = this.healthBySlot[2]

      this.healthBySlot[1] = msg.values['1']
      this.healthBySlot[2] = msg.values['2']

      if (msg.values['1'] < old1) {
        this.playHitFlash(this.ducks[1])
      }
      if (msg.values['2'] < old2) {
        this.playHitFlash(this.ducks[2])
      }
      return
    }

    if (msg.type === 'player_joined') {
      this.connected[msg.slot] = true
      return
    }

    if (msg.type === 'player_left') {
      this.connected[msg.slot] = false
      this.healthBySlot[msg.slot] = this.maxHealth
      const spawn = this.spawnFor(msg.slot)
      this.ducks[msg.slot].setPosition(spawn.x, spawn.y)
      this.ducks[msg.slot].play(`${this.slotAnimPrefix(msg.slot)}-idle`)
    }
  }

  create() {
    const cols = 12
    const rows = 18
    this.worldWidth = cols * 64
    this.worldHeight = rows * 64

    this.createTextures()
    this.createDuckyAnimations()
    this.drawGround(cols, rows)

    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight)
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight)

    this.obstacles = this.physics.add.staticGroup()

    this.placeLine(1, 1, 4, true, 'wall')
    this.placeLine(8, 1, 3, true, 'wall')
    this.placeLine(1, 16, 4, true, 'wall')
    this.placeLine(8, 16, 3, true, 'wall')
    this.placeLine(1, 2, 14, false, 'wall')
    this.placeLine(10, 2, 14, false, 'wall')

    this.placeLine(4, 4, 5, true, 'wall')
    this.placeLine(4, 9, 5, true, 'wall')
    this.placeLine(4, 13, 5, true, 'wall')
    this.placeLine(3, 7, 3, true, 'wall')
    this.placeLine(7, 7, 3, true, 'wall')
    this.placeLine(3, 3, 2, true, 'wall')
    this.placeLine(7, 3, 2, true, 'wall')

    this.placeLine(2, 2, 2, true, 'crate')
    this.placeLine(9, 2, 1, true, 'crate')
    this.placeLine(2, 6, 1, true, 'crate')
    this.placeLine(8, 6, 2, true, 'barrel')
    this.placeLine(2, 12, 2, true, 'crate')
    this.placeLine(8, 12, 2, true, 'crate')
    this.placeLine(2, 15, 2, true, 'barrel')
    this.placeLine(9, 15, 2, true, 'barrel')
    this.placeLine(6, 4, 1, true, 'crate')
    this.placeLine(6, 10, 1, true, 'crate')
    this.placeLine(6, 14, 2, true, 'crate')

    const bushCoords = [[3, 5], [8, 5], [3, 10], [8, 10], [5, 14], [6, 14], [3, 8], [8, 8]]
    bushCoords.forEach(([x, y]) => {
      this.add.image(x * 64 + 32, y * 64 + 32, 'bush').setDepth(1.5)
    })

    this.placeTrees(cols, rows)

    this.setupDucks()
    this.setupProjectiles()

    this.cameras.main.setZoom(0.95)

    this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys
    this.shootUpKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W) as Phaser.Input.Keyboard.Key
    this.shootLeftKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A) as Phaser.Input.Keyboard.Key
    this.shootDownKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S) as Phaser.Input.Keyboard.Key
    this.shootRightKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D) as Phaser.Input.Keyboard.Key

    this.healthBars = {
      1: this.add.graphics().setDepth(6),
      2: this.add.graphics().setDepth(6)
    }

    this.healthText = this.add.text(14, 14, 'Health: 100', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#1f2e1fcc',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setScrollFactor(0).setDepth(5)

    this.statusText = this.add.text(14, 46, 'Connecting...', {
      fontSize: '16px',
      color: '#ffeaa3',
      backgroundColor: '#1f2e1fcc',
      padding: { left: 8, right: 8, top: 4, bottom: 4 }
    }).setScrollFactor(0).setDepth(5)

    this.ws = connectToServer((msg) => this.handleServerMessage(msg))
  }

  update() {
    // Safety net: keep both duck bodies enabled/visible even if a bad overlap state occurs.
    ;([1, 2] as Slot[]).forEach((slot) => {
      const duck = this.ducks[slot]
      duck.setActive(true)
      duck.setVisible(true)
      if (duck.alpha <= 0) {
        duck.setAlpha(1)
      }
      const body = duck.body as Phaser.Physics.Arcade.Body
      if (!body.enable) {
        body.enable = true
      }
    })

    if (this.localSlot) {
      const localDuck = this.ducks[this.localSlot]
      const body = localDuck.body as Phaser.Physics.Arcade.Body

      if (this.cursors.left.isDown) {
        body.setAccelerationX(-600)
        localDuck.setFlipX(true)
      } else if (this.cursors.right.isDown) {
        body.setAccelerationX(600)
        localDuck.setFlipX(false)
      } else {
        body.setAccelerationX(0)
      }

      if (this.cursors.up.isDown) {
        body.setAccelerationY(-600)
      } else if (this.cursors.down.isDown) {
        body.setAccelerationY(600)
      } else {
        body.setAccelerationY(0)
      }

      if (this.shootUpKey.isDown) {
        this.shootDir.set(0, -1)
        this.tryShootLocal(0, -1)
      } else if (this.shootLeftKey.isDown) {
        this.shootDir.set(-1, 0)
        this.tryShootLocal(-1, 0)
      } else if (this.shootDownKey.isDown) {
        this.shootDir.set(0, 1)
        this.tryShootLocal(0, 1)
      } else if (this.shootRightKey.isDown) {
        this.shootDir.set(1, 0)
        this.tryShootLocal(1, 0)
      }

      const moving = Math.abs(body.velocity.x) > 8 || Math.abs(body.velocity.y) > 8
      const prefix = this.slotAnimPrefix(this.localSlot)
      const nextAnim = moving ? `${prefix}-walk` : `${prefix}-idle`
      if (localDuck.anims.currentAnim?.key !== nextAnim) {
        localDuck.play(nextAnim)
      }

      if (this.time.now - this.lastStateSentAt >= this.stateSendMs) {
        sendToServer(this.ws, {
          type: 'state',
          x: localDuck.x,
          y: localDuck.y,
          flipX: localDuck.flipX,
          moving
        })
        this.lastStateSentAt = this.time.now
      }

      this.healthText.setText(`Health: ${this.healthBySlot[this.localSlot]}`)

      const remoteSlot = this.otherSlot(this.localSlot)
      const remoteDuck = this.ducks[remoteSlot]
      const target = this.remoteTargets[remoteSlot]

      // Interpolate remote movement to remove jitter from network updates.
      const nextX = Phaser.Math.Linear(remoteDuck.x, target.x, 0.28)
      const nextY = Phaser.Math.Linear(remoteDuck.y, target.y, 0.28)
      remoteDuck.setPosition(nextX, nextY)
      remoteDuck.setFlipX(target.flipX)

      const remoteBody = remoteDuck.body as Phaser.Physics.Arcade.Body
      remoteBody.reset(nextX, nextY)
      remoteBody.setVelocity(0, 0)
      remoteBody.setAcceleration(0, 0)

      const remotePrefix = this.slotAnimPrefix(remoteSlot)
      const remoteAnim = target.moving ? `${remotePrefix}-walk` : `${remotePrefix}-idle`
      if (remoteDuck.anims.currentAnim?.key !== remoteAnim) {
        remoteDuck.play(remoteAnim)
      }
    }

    this.drawHealthBar(this.healthBars[1], this.ducks[1], this.healthBySlot[1], 0x52d668)
    this.drawHealthBar(this.healthBars[2], this.ducks[2], this.healthBySlot[2], 0xe45a5a)

    const groups = [this.localProjectiles, this.remoteProjectiles]
    groups.forEach((group) => {
      group.children.each((entry) => {
        const projectile = entry as Phaser.Physics.Arcade.Image
        if (!projectile.active) {
          return
        }

        const expiresAt = projectile.getData('expiresAt') as number
        const outOfBounds =
          projectile.x < 0 ||
          projectile.y < 0 ||
          projectile.x > this.worldWidth ||
          projectile.y > this.worldHeight

        if (this.time.now > expiresAt || outOfBounds) {
          this.despawnProjectile(projectile)
        }
      })
    })
  }
}
