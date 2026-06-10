import { ref, computed, reactive } from 'vue'
import type { Block, Layer, GameState, GameMode } from '@/types/game'
import { GAME_CONFIG, BLOCK_COLORS } from '@/types/game'

let blockIdCounter = 0

function createBlock(layer: number, position: number, direction: 'horizontal' | 'vertical', colorIndex?: number): Block {
  return {
    id: ++blockIdCounter,
    layer,
    position,
    direction,
    isRemoved: false,
    offsetX: 0,
    offsetZ: 0,
    rotationX: 0,
    rotationY: direction === 'horizontal' ? 0 : 90,
    rotationZ: 0,
    colorIndex: colorIndex ?? Math.floor(Math.random() * BLOCK_COLORS.length)
  }
}

function createLayer(index: number, useColors: boolean = false): Layer {
  const direction = index % 2 === 0 ? 'horizontal' : 'vertical'
  const blocks: Block[] = []
  for (let i = 0; i < GAME_CONFIG.BLOCKS_PER_LAYER; i++) {
    const colorIndex = useColors ? (index * 3 + i) % BLOCK_COLORS.length : 0
    blocks.push(createBlock(index, i, direction, colorIndex))
  }
  return {
    index,
    direction,
    blocks,
    fallOffsetY: 0,
    fallRotation: 0
  }
}

export function useJengaGame() {
  const gameState = reactive<GameState>({
    layers: [],
    currentLayerCount: GAME_CONFIG.INITIAL_LAYERS,
    selectedBlock: null,
    pulledBlock: null,
    gamePhase: 'selecting',
    score: 0,
    isGameOver: false,
    towerHeight: GAME_CONFIG.INITIAL_LAYERS * GAME_CONFIG.BLOCK_HEIGHT,
    gameMode: 'classic',
    dice: {
      isRolling: false,
      value: 1,
      targetLayer: null
    }
  })

  const pulledBlockPosition = ref({ x: 0, y: 0, z: 0 })
  const towerShake = ref({ x: 0, y: 0, z: 0 })
  const towerTilt = ref({ x: 0, z: 0 })
  const diceAnimValue = ref(1)

  const topLayerIndex = computed(() => {
    return gameState.layers.length - 1
  })

  const maxSelectableLayer = computed(() => {
    return Math.max(0, topLayerIndex.value - GAME_CONFIG.TOP_SAFE_LAYERS)
  })

  const canSelectLayer = (layerIndex: number): boolean => {
    const topIdx = topLayerIndex.value
    if (layerIndex > topIdx - GAME_CONFIG.TOP_SAFE_LAYERS) return false

    if (gameState.gameMode === 'advanced' && gameState.dice.targetLayer !== null) {
      return layerIndex === gameState.dice.targetLayer
    }
    return true
  }

  const getBlockBasePosition = (block: Block) => {
    let x = 0
    let z = 0
    const width = GAME_CONFIG.BLOCK_WIDTH

    if (block.direction === 'horizontal') {
      x = 0
      z = (block.position - 1) * width
    } else {
      x = (block.position - 1) * width
      z = 0
    }

    return { x, z }
  }

  const initGame = (mode: GameMode = 'classic') => {
    blockIdCounter = 0
    gameState.layers = []
    const useColors = mode === 'advanced'
    for (let i = 0; i < GAME_CONFIG.INITIAL_LAYERS; i++) {
      gameState.layers.push(createLayer(i, useColors))
    }
    gameState.currentLayerCount = GAME_CONFIG.INITIAL_LAYERS
    gameState.selectedBlock = null
    gameState.pulledBlock = null
    gameState.gamePhase = 'selecting'
    gameState.score = 0
    gameState.isGameOver = false
    gameState.towerHeight = GAME_CONFIG.INITIAL_LAYERS * GAME_CONFIG.BLOCK_HEIGHT
    gameState.gameMode = mode
    gameState.dice = {
      isRolling: false,
      value: 1,
      targetLayer: null
    }
    pulledBlockPosition.value = { x: 0, y: 0, z: 0 }
    towerShake.value = { x: 0, y: 0, z: 0 }
    towerTilt.value = { x: 0, z: 0 }

    if (mode === 'advanced') {
      gameState.gamePhase = 'rolling'
    }
  }

  const rollDice = (): Promise<number> => {
    return new Promise((resolve) => {
      gameState.dice.isRolling = true
      gameState.gamePhase = 'rolling'
      gameState.dice.targetLayer = null

      const finalValue = Math.floor(Math.random() * GAME_CONFIG.DICE_SIDES) + 1

      setTimeout(() => {
        diceAnimValue.value = finalValue
        gameState.dice.value = finalValue
        gameState.dice.isRolling = false

        const maxLayer = maxSelectableLayer.value
        const targetLayer = Math.min(finalValue - 1, maxLayer)
        gameState.dice.targetLayer = targetLayer

        gameState.gamePhase = 'selecting'
        resolve(finalValue)
      }, 1500)
    })
  }

  const selectBlock = (block: Block): boolean => {
    if (gameState.gamePhase !== 'selecting') return false
    if (!canSelectLayer(block.layer)) return false
    if (block.isRemoved) return false

    const layer = gameState.layers[block.layer]
    const remainingBlocks = layer.blocks.filter(b => !b.isRemoved)
    if (remainingBlocks.length <= 1) return false

    gameState.selectedBlock = block
    gameState.gamePhase = 'pulling'
    return true
  }

  const calculateStability = (): number => {
    let totalRisk = 0
    const layerCount = gameState.layers.length

    for (let i = 0; i < layerCount - 1; i++) {
      const layer = gameState.layers[i]
      const upperLayer = gameState.layers[i + 1]

      const remainingBlocks = layer.blocks.filter(b => !b.isRemoved)
      const upperRemaining = upperLayer.blocks.filter(b => !b.isRemoved)

      if (remainingBlocks.length === 0) {
        totalRisk += 100
        continue
      }

      const heightFactor = i / layerCount

      if (remainingBlocks.length === 1) {
        totalRisk += 30 * (1 + heightFactor * 0.5)
      } else if (remainingBlocks.length === 2) {
        const positions = remainingBlocks.map(b => b.position).sort((a, b) => a - b)
        if (positions[0] === 0 && positions[1] === 2) {
          totalRisk += 18 * (1 + heightFactor * 0.3)
        } else {
          totalRisk += 8 * (1 + heightFactor * 0.2)
        }
      }

      if (upperRemaining.length > 0 && remainingBlocks.length === 1) {
        const upperWeight = upperRemaining.length * 10
        totalRisk += upperWeight * (1 + heightFactor)
      }
    }

    return Math.min(100, totalRisk)
  }

  const pullBlock = (pullProgress: number): boolean => {
    if (gameState.gamePhase !== 'pulling' || !gameState.selectedBlock) return false

    const block = gameState.selectedBlock
    const maxPull = GAME_CONFIG.PULL_DISTANCE
    const distance = Math.min(pullProgress, maxPull)

    if (block.direction === 'horizontal') {
      block.offsetX = distance
    } else {
      block.offsetZ = distance
    }

    const stability = calculateStability()
    const pullFactor = distance / maxPull
    const totalRisk = (stability / 100) * 0.6 + pullFactor * 0.4

    const shakeIntensity = Math.min(8, totalRisk * 15)
    towerShake.value = {
      x: (Math.random() - 0.5) * shakeIntensity,
      y: (Math.random() - 0.5) * shakeIntensity * 0.3,
      z: (Math.random() - 0.5) * shakeIntensity
    }

    const tiltIntensity = Math.min(3, totalRisk * 5)
    towerTilt.value = {
      x: (Math.random() - 0.5) * tiltIntensity,
      z: (Math.random() - 0.5) * tiltIntensity
    }

    const fallChance = totalRisk * totalRisk * 0.01
    if (Math.random() < fallChance) {
      triggerFall()
      return false
    }

    if (distance >= maxPull) {
      block.isRemoved = true
      gameState.pulledBlock = { ...block }
      gameState.gamePhase = 'placing'
      towerShake.value = { x: 0, y: 0, z: 0 }
      towerTilt.value = { x: 0, z: 0 }

      const basePos = getBlockBasePosition(block)
      const layerY = block.layer * GAME_CONFIG.BLOCK_HEIGHT
      pulledBlockPosition.value = {
        x: basePos.x + block.offsetX,
        y: layerY,
        z: basePos.z + block.offsetZ
      }
    }

    return true
  }

  const placeBlock = (): boolean => {
    if (gameState.gamePhase !== 'placing' || !gameState.pulledBlock) return false

    const block = gameState.pulledBlock
    const topIdx = topLayerIndex.value
    const topLayer = gameState.layers[topIdx]

    const nonRemovedBlocks = topLayer.blocks.filter(b => !b.isRemoved)

    if (nonRemovedBlocks.length < GAME_CONFIG.BLOCKS_PER_LAYER) {
      const emptyPos = topLayer.blocks.findIndex(b => b.isRemoved)
      if (emptyPos !== -1) {
        const newBlock = {
          ...block,
          layer: topIdx,
          position: emptyPos,
          direction: topLayer.direction,
          isRemoved: false,
          offsetX: 0,
          offsetZ: 0,
          rotationY: topLayer.direction === 'horizontal' ? 0 : 90,
          colorIndex: block.colorIndex
        }
        topLayer.blocks[emptyPos] = newBlock
      }
    } else {
      const newDirection = topIdx % 2 === 0 ? 'vertical' : 'horizontal'
      const newLayer: Layer = {
        index: topIdx + 1,
        direction: newDirection,
        blocks: [
          {
            ...block,
            id: ++blockIdCounter,
            layer: topIdx + 1,
            position: 0,
            direction: newDirection,
            isRemoved: false,
            offsetX: 0,
            offsetZ: 0,
            rotationX: 0,
            rotationY: newDirection === 'horizontal' ? 0 : 90,
            rotationZ: 0,
            colorIndex: block.colorIndex
          },
          createBlock(topIdx + 1, 1, newDirection, (topIdx + 1) % BLOCK_COLORS.length),
          createBlock(topIdx + 1, 2, newDirection, (topIdx + 2) % BLOCK_COLORS.length)
        ],
        fallOffsetY: 0,
        fallRotation: 0
      }
      gameState.layers.push(newLayer)
      gameState.currentLayerCount++
      gameState.towerHeight = gameState.layers.length * GAME_CONFIG.BLOCK_HEIGHT
    }

    gameState.pulledBlock = null
    gameState.selectedBlock = null
    gameState.score++

    const stability = calculateStability()
    if (stability > 70 && Math.random() < 0.3) {
      triggerFall()
      return false
    }

    if (gameState.gameMode === 'advanced') {
      gameState.dice.targetLayer = null
      gameState.gamePhase = 'rolling'
    } else {
      gameState.gamePhase = 'selecting'
    }

    return true
  }

  const triggerFall = () => {
    gameState.gamePhase = 'falling'
    gameState.isGameOver = true

    gameState.layers.forEach((layer, index) => {
      setTimeout(() => {
        layer.fallOffsetY = Math.random() * 200 + 100
        layer.fallRotation = (Math.random() - 0.5) * 180
      }, index * 50)
    })

    setTimeout(() => {
      gameState.gamePhase = 'gameover'
    }, 2000)
  }

  const cancelPull = () => {
    if (gameState.gamePhase !== 'pulling' || !gameState.selectedBlock) return

    const block = gameState.selectedBlock
    block.offsetX = 0
    block.offsetZ = 0
    gameState.selectedBlock = null
    gameState.gamePhase = 'selecting'
    towerShake.value = { x: 0, y: 0, z: 0 }
    towerTilt.value = { x: 0, z: 0 }
  }

  const skipRoll = () => {
    if (gameState.gameMode !== 'advanced') return
    if (gameState.gamePhase !== 'rolling') return
    rollDice()
  }

  return {
    gameState,
    topLayerIndex,
    pulledBlockPosition,
    towerShake,
    towerTilt,
    diceAnimValue,
    canSelectLayer,
    getBlockBasePosition,
    initGame,
    selectBlock,
    pullBlock,
    placeBlock,
    cancelPull,
    calculateStability,
    rollDice,
    skipRoll
  }
}
