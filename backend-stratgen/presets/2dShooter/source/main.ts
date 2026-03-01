import Phaser from 'phaser'
import GameScene from './scenes/GameScene'
import './styles.css'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 768,
  height: 1152,
  parent: 'game',
  backgroundColor: '#5ea936',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [GameScene]
}

new Phaser.Game(config)
