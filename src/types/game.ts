export type BlockDirection = 'horizontal' | 'vertical'
export type GameMode = 'classic' | 'advanced'

export interface Block {
  id: number
  layer: number
  position: number
  direction: BlockDirection
  isRemoved: boolean
  offsetX: number
  offsetZ: number
  rotationX: number
  rotationY: number
  rotationZ: number
  colorIndex: number
}

export interface Layer {
  index: number
  direction: BlockDirection
  blocks: Block[]
  fallOffsetY: number
  fallRotation: number
}

export type GamePhase = 'selecting' | 'pulling' | 'placing' | 'falling' | 'gameover' | 'rolling'

export interface DiceState {
  isRolling: boolean
  value: number
  targetLayer: number | null
}

export interface GameState {
  layers: Layer[]
  currentLayerCount: number
  selectedBlock: Block | null
  pulledBlock: Block | null
  gamePhase: GamePhase
  score: number
  isGameOver: boolean
  towerHeight: number
  gameMode: GameMode
  dice: DiceState
}

export const BLOCK_COLORS = [
  { front: '#ff6b6b', back: '#c92a2a', side: '#e03131', top: '#ff8787', bottom: '#a61e1e' },
  { front: '#ffd43b', back: '#e67700', side: '#f59f00', top: '#ffe066', bottom: '#b65d00' },
  { front: '#69db7c', back: '#2f9e44', side: '#40c057', top: '#8ce99a', bottom: '#246e2e' },
  { front: '#4dabf7', back: '#1971c2', side: '#339af0', top: '#74c0fc', bottom: '#1864ab' },
  { front: '#da77f2', back: '#ae3ec9', side: '#be4bdb', top: '#e599f7', bottom: '#862e9c' },
  { front: '#ff922b', back: '#d9480f', side: '#f76707', top: '#ffa94d', bottom: '#b84512' }
] as const

export const GAME_CONFIG = {
  TOTAL_BLOCKS: 54,
  BLOCKS_PER_LAYER: 3,
  INITIAL_LAYERS: 18,
  BLOCK_WIDTH: 30,
  BLOCK_LENGTH: 90,
  BLOCK_HEIGHT: 18,
  TOP_SAFE_LAYERS: 3,
  PULL_DISTANCE: 120,
  TOWER_ROTATE_X: -15,
  TOWER_ROTATE_Y: 35,
  DICE_SIDES: 6
} as const
