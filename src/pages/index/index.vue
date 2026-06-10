<template>
  <view class="game-container">
    <view v-if="showModeSelect" class="mode-select-overlay">
      <view class="mode-select-panel">
        <text class="mode-title">选择玩法</text>
        <view class="mode-options">
          <view class="mode-card" @click="selectMode('classic')">
            <view class="mode-icon classic-icon">
              <text class="mode-icon-text">🏗️</text>
            </view>
            <text class="mode-name">经典玩法</text>
            <text class="mode-desc">自由选择任意积木抽取</text>
            <text class="mode-btn">开始游戏</text>
          </view>
          <view class="mode-card advanced" @click="selectMode('advanced')">
            <view class="mode-icon advanced-icon">
              <text class="mode-icon-text">🎲</text>
            </view>
            <text class="mode-name">进阶玩法</text>
            <text class="mode-desc">掷骰子决定抽取层数</text>
            <text class="mode-btn">开始游戏</text>
          </view>
        </view>
      </view>
    </view>

    <view class="game-header">
      <view class="header-left">
        <view class="back-btn" @click="onBackToMenu">
          <text class="back-icon">←</text>
        </view>
      </view>
      <view class="title-area">
        <text class="game-title">{{ gameState.gameMode === 'advanced' ? '🎲 进阶叠叠乐' : '叠叠乐' }}</text>
      </view>
      <view class="header-right">
        <view class="stat-card">
          <text class="stat-label">分数</text>
          <text class="stat-value">{{ gameState.score }}</text>
        </view>
        <view class="stat-card stat-layers">
          <text class="stat-label">层数</text>
          <text class="stat-value">{{ gameState.layers.length }}</text>
        </view>
      </view>
    </view>

    <view class="tower-container">
      <view 
        v-if="gameState.gameMode === 'advanced' && gameState.dice.targetLayer !== null && gameState.gamePhase === 'selecting'" 
        class="target-indicator"
        :style="targetIndicatorStyle"
      >
        <text class="target-hand">👆</text>
        <text class="target-text">第{{ gameState.dice.targetLayer + 1 }}层</text>
      </view>
      <view class="tower-scene">
        <view 
          class="tower-3d"
          :class="{ 'tower-falling': gameState.gamePhase === 'falling' }"
          :style="towerStyle"
        >
          <view 
            v-for="layer in gameState.layers" 
            :key="layer.index" 
            class="layer"
            :class="{ 
              'layer-falling': layer.fallOffsetY > 0,
              'layer-target': isTargetLayer(layer.index)
            }"
            :style="getLayerStyle(layer)"
          >
            <view
              v-for="block in layer.blocks"
              :key="block.id"
              class="block"
              :class="{
                'block-hidden': block.isRemoved,
                'block-selected': isSelected(block),
                'block-selectable': canSelect(block),
                'block-pulling': isPulling(block)
              }"
              :style="getBlockStyle(block)"
              @click="onBlockClick(block)"
            >
              <view class="block-face block-front" :style="getBlockColorStyle(block, 'front')"></view>
              <view class="block-face block-back" :style="getBlockColorStyle(block, 'back')"></view>
              <view class="block-face block-left" :style="getBlockColorStyle(block, 'left')"></view>
              <view class="block-face block-right" :style="getBlockColorStyle(block, 'right')"></view>
              <view class="block-face block-top" :style="getBlockColorStyle(block, 'top')"></view>
              <view class="block-face block-bottom" :style="getBlockColorStyle(block, 'bottom')"></view>
            </view>
          </view>
        </view>
      </view>

      <view 
        v-if="gameState.pulledBlock && gameState.gamePhase === 'placing'"
        class="floating-block"
        :style="floatingBlockStyle"
      >
        <view class="block-face block-front" :style="getBlockColorStyle(gameState.pulledBlock, 'front')"></view>
        <view class="block-face block-back" :style="getBlockColorStyle(gameState.pulledBlock, 'back')"></view>
        <view class="block-face block-left" :style="getBlockColorStyle(gameState.pulledBlock, 'left')"></view>
        <view class="block-face block-right" :style="getBlockColorStyle(gameState.pulledBlock, 'right')"></view>
        <view class="block-face block-top" :style="getBlockColorStyle(gameState.pulledBlock, 'top')"></view>
        <view class="block-face block-bottom" :style="getBlockColorStyle(gameState.pulledBlock, 'bottom')"></view>
      </view>
    </view>

    <view class="stability-section">
      <text class="stability-label">塔稳定性</text>
      <view class="stability-track">
        <view 
          class="stability-fill"
          :class="stabilityClass"
          :style="{ width: stabilityPercent + '%' }"
        ></view>
      </view>
      <text class="stability-value">{{ Math.round(stabilityPercent) }}%</text>
    </view>

    <view class="control-panel">
      <view v-if="gameState.gamePhase === 'rolling'" class="phase-rolling">
        <text class="roll-hint">掷骰子决定抽取层数</text>
        <view class="dice-scene">
          <view 
            class="dice-3d" 
            :class="{ 'dice-rolling': gameState.dice.isRolling }"
            :style="diceRotationStyle"
          >
            <view class="dice-face dice-face-front">
              <view class="dot dot-center"></view>
            </view>
            <view class="dice-face dice-face-back">
              <view class="dot dot-top-left"></view>
              <view class="dot dot-bottom-right"></view>
            </view>
            <view class="dice-face dice-face-right">
              <view class="dot dot-top-left"></view>
              <view class="dot dot-center"></view>
              <view class="dot dot-bottom-right"></view>
            </view>
            <view class="dice-face dice-face-left">
              <view class="dot dot-top-left"></view>
              <view class="dot dot-top-right"></view>
              <view class="dot dot-bottom-left"></view>
              <view class="dot dot-bottom-right"></view>
            </view>
            <view class="dice-face dice-face-top">
              <view class="dot dot-top-left"></view>
              <view class="dot dot-top-right"></view>
              <view class="dot dot-center"></view>
              <view class="dot dot-bottom-left"></view>
              <view class="dot dot-bottom-right"></view>
            </view>
            <view class="dice-face dice-face-bottom">
              <view class="dot dot-top-left"></view>
              <view class="dot dot-top-right"></view>
              <view class="dot dot-middle-left"></view>
              <view class="dot dot-middle-right"></view>
              <view class="dot dot-bottom-left"></view>
              <view class="dot dot-bottom-right"></view>
            </view>
          </view>
        </view>
        <text v-if="gameState.dice.targetLayer !== null" class="roll-result">
          🎲 点数 {{ displayDiceValue }} · 请从第 {{ gameState.dice.targetLayer + 1 }} 层抽取
        </text>
        <button 
          v-if="!gameState.dice.isRolling && gameState.dice.targetLayer === null" 
          class="btn btn-roll" 
          @click="onRollDice"
        >
          掷骰子
        </button>
        <button 
          v-if="!gameState.dice.isRolling && gameState.dice.targetLayer !== null" 
          class="btn btn-roll" 
          @click="onRollDice"
        >
          再掷一次
        </button>
      </view>

      <view v-if="gameState.gamePhase === 'selecting'" class="phase-selecting">
        <template v-if="gameState.gameMode === 'advanced'">
          <text class="hint-text">从高亮的第 {{ gameState.dice.targetLayer !== null ? gameState.dice.targetLayer + 1 : '-' }} 层选择积木</text>
          <text class="sub-hint" @click="onRollDice">🎲 点击重新掷骰子</text>
        </template>
        <template v-else>
          <text class="hint-text">点击下方积木选择要抽取的方块</text>
          <text class="sub-hint">最高三层不可抽取</text>
        </template>
      </view>

      <view v-if="gameState.gamePhase === 'pulling'" class="phase-pulling">
        <text class="action-hint">按住抽取按钮慢慢抽出</text>
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: pullProgressPercent + '%' }"></view>
        </view>
        <view class="action-buttons">
          <button 
            class="btn btn-pull" 
            @touchstart.prevent="startPull" 
            @touchend="stopPull"
            @touchcancel="stopPull"
            @mousedown="startPull"
            @mouseup="stopPull"
            @mouseleave="stopPull"
          >
            按住抽取
          </button>
          <button class="btn btn-cancel" @click="onCancelPull">
            放回
          </button>
        </view>
      </view>

      <view v-if="gameState.gamePhase === 'placing'" class="phase-placing">
        <text class="action-hint">将积木放置到塔顶</text>
        <button class="btn btn-place" @click="onPlaceBlock">
          放置到顶层
        </button>
      </view>

      <view v-if="gameState.gamePhase === 'falling'" class="phase-falling">
        <text class="fall-text">哗啦！塔倒了！</text>
      </view>

      <view v-if="gameState.gamePhase === 'gameover'" class="phase-gameover">
        <text class="gameover-title">游戏结束</text>
        <view class="final-stats">
          <view class="final-stat">
            <text class="final-stat-label">最终得分</text>
            <text class="final-stat-value">{{ gameState.score }}</text>
          </view>
          <view class="final-stat">
            <text class="final-stat-label">最高层数</text>
            <text class="final-stat-value">{{ gameState.layers.length }}</text>
          </view>
        </view>
        <view class="gameover-buttons">
          <button class="btn btn-restart" @click="onRestart">
            再来一局
          </button>
          <button class="btn btn-switch" @click="onSwitchMode">
            切换玩法
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useJengaGame } from '@/composables/useJengaGame'
import { GAME_CONFIG, BLOCK_COLORS } from '@/types/game'
import type { Block, Layer, GameMode } from '@/types/game'

const {
  gameState,
  towerShake,
  towerTilt,
  pulledBlockPosition,
  diceAnimValue,
  canSelectLayer,
  getBlockBasePosition,
  initGame,
  selectBlock,
  pullBlock,
  placeBlock,
  cancelPull,
  calculateStability,
  rollDice
} = useJengaGame()

const showModeSelect = ref(true)
const pullProgress = ref(0)
const isPullingActive = ref(false)
const floatingY = ref(0)
let floatingAnimFrame: number | null = null

const stabilityPercent = computed(() => {
  const risk = calculateStability()
  return Math.max(0, 100 - risk)
})

const stabilityClass = computed(() => {
  const s = stabilityPercent.value
  if (s > 70) return 'stability-high'
  if (s > 40) return 'stability-medium'
  return 'stability-low'
})

const pullProgressPercent = computed(() => {
  return (pullProgress.value / GAME_CONFIG.PULL_DISTANCE) * 100
})

const displayDiceValue = computed(() => {
  if (gameState.dice.isRolling) {
    return diceAnimValue.value
  }
  return gameState.dice.value
})

const diceRotationStyle = computed(() => {
  if (gameState.dice.isRolling) {
    return {}
  }
  const value = gameState.dice.value
  const rotations: Record<number, string> = {
    1: 'rotateX(0deg) rotateY(0deg)',
    2: 'rotateX(0deg) rotateY(180deg)',
    3: 'rotateX(0deg) rotateY(-90deg)',
    4: 'rotateX(0deg) rotateY(90deg)',
    5: 'rotateX(-90deg) rotateY(0deg)',
    6: 'rotateX(90deg) rotateY(0deg)'
  }
  return {
    transform: rotations[value] || rotations[1]
  }
})

const targetIndicatorStyle = computed(() => {
  const layerIndex = gameState.dice.targetLayer
  if (layerIndex === null) return {}
  const blockHeight = 18
  const sceneHeight = 350
  const topOffset = sceneHeight / 2 - layerIndex * blockHeight - blockHeight / 2
  return {
    top: `${topOffset}px`
  }
})

const towerStyle = computed(() => {
  const shakeX = towerShake.value.x
  const shakeY = towerShake.value.y
  const shakeZ = towerShake.value.z
  const tiltX = towerTilt.value.x
  const tiltZ = towerTilt.value.z
  
  const rotX = GAME_CONFIG.TOWER_ROTATE_X + tiltX
  const rotY = GAME_CONFIG.TOWER_ROTATE_Y + tiltZ
  
  return {
    transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) translateX(${shakeX}px) translateY(${shakeY}px) translateZ(${shakeZ}px)`
  }
})

const floatingBlockStyle = computed(() => {
  const block = gameState.pulledBlock
  if (!block) return {}
  
  const basePos = getBlockBasePosition(block)
  const yOffset = floatingY.value
  
  const rotX = GAME_CONFIG.TOWER_ROTATE_X
  const rotY = GAME_CONFIG.TOWER_ROTATE_Y + (block.direction === 'vertical' ? 90 : 0)
  
  return {
    width: `${GAME_CONFIG.BLOCK_LENGTH}px`,
    height: `${GAME_CONFIG.BLOCK_HEIGHT}px`,
    transform: `translate3d(${basePos.x}px, ${-yOffset}px, ${basePos.z + 60}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`
  }
})

const isTargetLayer = (layerIndex: number): boolean => {
  if (gameState.gameMode !== 'advanced') return false
  return gameState.dice.targetLayer === layerIndex
}

const getLayerStyle = (layer: Layer) => {
  const y = -layer.index * GAME_CONFIG.BLOCK_HEIGHT
  const fallY = layer.fallOffsetY
  const fallRot = layer.fallRotation
  
  if (fallY > 0) {
    return {
      transform: `translateY(${y - fallY}px) rotateX(${fallRot}deg)`,
      opacity: 0.8,
      transition: 'transform 0.8s ease-in, opacity 0.8s ease'
    }
  }
  
  return {
    transform: `translateY(${y}px)`
  }
}

const getBlockStyle = (block: Block) => {
  const basePos = getBlockBasePosition(block)
  const x = basePos.x + block.offsetX
  const z = basePos.z + block.offsetZ
  
  return {
    width: `${GAME_CONFIG.BLOCK_LENGTH}px`,
    height: `${GAME_CONFIG.BLOCK_HEIGHT}px`,
    transform: `translate3d(${x}px, 0, ${z}px) rotateY(${block.rotationY}deg)`
  }
}

const getBlockColorStyle = (block: Block, face: string) => {
  if (gameState.gameMode === 'classic') {
    return {}
  }
  const colors = BLOCK_COLORS[block.colorIndex % BLOCK_COLORS.length]
  const colorMap: Record<string, string> = {
    front: colors.front,
    back: colors.back,
    left: colors.side,
    right: colors.side,
    top: colors.top,
    bottom: colors.bottom
  }
  return {
    background: colorMap[face],
    borderColor: colors.back
  }
}

const isSelected = (block: Block): boolean => {
  return gameState.selectedBlock?.id === block.id
}

const isPulling = (block: Block): boolean => {
  return isSelected(block) && gameState.gamePhase === 'pulling' && pullProgress.value > 0
}

const canSelect = (block: Block): boolean => {
  return canSelectLayer(block.layer) && !block.isRemoved && gameState.gamePhase === 'selecting'
}

const selectMode = (mode: GameMode) => {
  showModeSelect.value = false
  initGame(mode)
}

const onBlockClick = (block: Block) => {
  if (gameState.gamePhase !== 'selecting') return
  if (!canSelectLayer(block.layer)) return
  if (block.isRemoved) return
  
  selectBlock(block)
  pullProgress.value = 0
}

const onRollDice = () => {
  rollDice()
}

let pullInterval: number | null = null

const startPull = () => {
  if (gameState.gamePhase !== 'pulling') return
  isPullingActive.value = true
  
  pullInterval = setInterval(() => {
    pullProgress.value += 2
    const success = pullBlock(pullProgress.value)
    if (!success || pullProgress.value >= GAME_CONFIG.PULL_DISTANCE) {
      stopPull()
    }
  }, 25) as unknown as number
}

const stopPull = () => {
  isPullingActive.value = false
  if (pullInterval) {
    clearInterval(pullInterval)
    pullInterval = null
  }
}

const onCancelPull = () => {
  stopPull()
  cancelPull()
  pullProgress.value = 0
}

const onPlaceBlock = () => {
  placeBlock()
  pullProgress.value = 0
}

const onRestart = () => {
  stopFloatingAnim()
  initGame(gameState.gameMode)
  pullProgress.value = 0
}

const onBackToMenu = () => {
  stopFloatingAnim()
  showModeSelect.value = true
}

const onSwitchMode = () => {
  stopFloatingAnim()
  showModeSelect.value = true
}

const startFloatingAnim = () => {
  let direction = 1
  const animate = () => {
    floatingY.value += direction * 0.5
    if (floatingY.value > 20) direction = -1
    if (floatingY.value < 0) direction = 1
    floatingAnimFrame = requestAnimationFrame(animate)
  }
  floatingAnimFrame = requestAnimationFrame(animate)
}

const stopFloatingAnim = () => {
  if (floatingAnimFrame) {
    cancelAnimationFrame(floatingAnimFrame)
    floatingAnimFrame = null
  }
}

onMounted(() => {
  // 显示模式选择界面
})
</script>

<style lang="scss" scoped>
.game-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.mode-select-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.mode-select-panel {
  width: 90%;
  max-width: 600rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx;
}

.mode-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  width: 100%;
}

.mode-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(10px);
  border-radius: 24rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.mode-card:active {
  transform: scale(0.95);
}

.mode-card.advanced {
  background: linear-gradient(145deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.15));
  border-color: rgba(236, 72, 153, 0.3);
}

.mode-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
}

.classic-icon {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
}

.advanced-icon {
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  box-shadow: 0 4px 20px rgba(236, 72, 153, 0.4);
}

.mode-icon-text {
  font-size: 48rpx;
}

.mode-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.mode-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.mode-btn {
  margin-top: 10rpx;
  padding: 12rpx 40rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #fff;
}

.game-header {
  width: 100%;
  padding: 60rpx 20rpx 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  z-index: 10;
}

.header-left {
  width: 80rpx;
  display: flex;
  justify-content: flex-start;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:active {
  transform: scale(0.9);
  background: rgba(255, 255, 255, 0.2);
}

.back-icon {
  font-size: 36rpx;
  color: #fff;
  font-weight: bold;
}

.title-area {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-right {
  display: flex;
  gap: 12rpx;
  align-items: center;
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 12rpx;
  padding: 10rpx 18rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70rpx;
}

.stat-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4rpx;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.title-area {
  flex: 1;
  display: flex;
  justify-content: center;
}

.game-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  letter-spacing: 2rpx;
}

.tower-container {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  perspective: 800px;
  overflow: visible;
}

.target-indicator {
  position: absolute;
  left: 50%;
  margin-left: 80px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 50;
  animation: indicatorBounce 0.8s ease-in-out infinite;
  pointer-events: none;
}

.target-hand {
  font-size: 40rpx;
  animation: handPoint 0.6s ease-in-out infinite;
}

.target-text {
  font-size: 22rpx;
  color: #ffd700;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.4);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-top: -6rpx;
}

@keyframes indicatorBounce {
  0%, 100% { transform: translateY(-50%) translateX(0); }
  50% { transform: translateY(-50%) translateX(-6px); }
}

@keyframes handPoint {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-8px); }
}

.tower-scene {
  position: relative;
  width: 200px;
  height: 350px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tower-3d {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.15s ease-out;
}

.tower-falling {
  animation: towerFall 1.5s ease-in forwards;
}

@keyframes towerFall {
  0% { transform: rotateX(-15deg) rotateY(35deg); }
  100% { transform: rotateX(70deg) rotateY(35deg) translateY(200px); opacity: 0.3; }
}

.layer {
  position: absolute;
  width: 100%;
  height: 18px;
  transform-style: preserve-3d;
  left: 50%;
  top: 50%;
  margin-left: -45px;
}

.layer-target {
  z-index: 5;
  
  &::before {
    content: '';
    position: absolute;
    left: -15px;
    right: -15px;
    top: -4px;
    bottom: -4px;
    border: 3px solid #ffd700;
    border-radius: 6px;
    animation: targetRingPulse 1s ease-in-out infinite;
    pointer-events: none;
  }
  
  .block-selectable {
    animation: targetPulse 1s ease-in-out infinite;
    filter: brightness(1.3) drop-shadow(0 0 6px #ffd700);
  }
}

@keyframes targetRingPulse {
  0%, 100% { 
    opacity: 0.6;
    transform: scaleX(1);
  }
  50% { 
    opacity: 1;
    transform: scaleX(1.05);
  }
}

@keyframes targetPulse {
  0%, 100% { 
    filter: brightness(1.2) drop-shadow(0 0 5px rgba(255, 215, 0, 0.6));
  }
  50% { 
    filter: brightness(1.5) drop-shadow(0 0 15px rgba(255, 215, 0, 1));
  }
}

.block {
  position: absolute;
  transform-style: preserve-3d;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
  will-change: transform;
}

.block-selectable:hover {
  filter: brightness(1.2);
  z-index: 10;
}

.block-selectable:active {
  filter: brightness(1.3);
}

.block-selected {
  filter: brightness(1.3) saturate(1.2);
  z-index: 20;
}

.block-pulling {
  transition: none;
}

.block-hidden {
  opacity: 0;
  pointer-events: none;
}

.block-face {
  position: absolute;
  background: linear-gradient(145deg, #d4a574 0%, #c49a6c 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.block-front {
  width: 100%;
  height: 100%;
  transform: translateZ(9px);
  background: linear-gradient(180deg, #e8c49a 0%, #d4a574 50%, #c49a6c 100%);
  border: 1px solid #a67c52;
  box-sizing: border-box;
}

.block-back {
  width: 100%;
  height: 100%;
  transform: translateZ(-9px) rotateY(180deg);
  background: linear-gradient(180deg, #a67c52 0%, #8b6914 100%);
}

.block-left {
  width: 18px;
  height: 100%;
  left: 0;
  transform: translateX(-9px) rotateY(-90deg);
  background: linear-gradient(90deg, #b8956a 0%, #a67c52 100%);
}

.block-right {
  width: 18px;
  height: 100%;
  right: 0;
  transform: translateX(9px) rotateY(90deg);
  background: linear-gradient(90deg, #c49a6c 0%, #b8956a 100%);
}

.block-top {
  width: 100%;
  height: 18px;
  top: 0;
  transform: translateY(-9px) rotateX(90deg);
  background: linear-gradient(180deg, #f0d4a8 0%, #e8c49a 100%);
}

.block-bottom {
  width: 100%;
  height: 18px;
  bottom: 0;
  transform: translateY(9px) rotateX(-90deg);
  background: linear-gradient(180deg, #8b6914 0%, #6b4f0f 100%);
}

.floating-block {
  position: absolute;
  transform-style: preserve-3d;
  pointer-events: none;
  left: 50%;
  top: 30%;
  margin-left: -45px;
  z-index: 100;
  animation: floatBlock 2s ease-in-out infinite;
}

@keyframes floatBlock {
  0%, 100% { margin-top: 0; }
  50% { margin-top: -20px; }
}

.stability-section {
  width: 85%;
  padding: 20rpx 0;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.stability-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

.stability-track {
  flex: 1;
  height: 12rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6rpx;
  overflow: hidden;
}

.stability-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.stability-high {
  background: linear-gradient(90deg, #22c55e, #4ade80);
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
}

.stability-medium {
  background: linear-gradient(90deg, #f59e0b, #facc15);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
}

.stability-low {
  background: linear-gradient(90deg, #dc2626, #f87171);
  box-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
  animation: stabilityPulse 0.5s ease-in-out infinite;
}

@keyframes stabilityPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.stability-value {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  min-width: 70rpx;
  text-align: right;
}

.control-panel {
  width: 100%;
  min-height: 280rpx;
  padding: 20rpx 30rpx 50rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.phase-rolling {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.roll-hint {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
}

.dice-scene {
  perspective: 300px;
  margin: 10rpx 0 20rpx;
}

.dice-3d {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
}

.dice-rolling {
  animation: diceRoll3d 0.4s linear infinite;
}

@keyframes diceRoll3d {
  0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1); }
  25% { transform: rotateX(90deg) rotateY(90deg) rotateZ(45deg) scale(1.1); }
  50% { transform: rotateX(180deg) rotateY(180deg) rotateZ(90deg) scale(1); }
  75% { transform: rotateX(270deg) rotateY(270deg) rotateZ(135deg) scale(1.1); }
  100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(180deg) scale(1); }
}

.dice-face {
  position: absolute;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  border: 2px solid #d0d0d0;
  border-radius: 14rpx;
  box-sizing: border-box;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 -2px 8px rgba(255, 255, 255, 0.8);
}

.dice-face-front {
  transform: translateZ(50rpx);
}

.dice-face-back {
  transform: rotateY(180deg) translateZ(50rpx);
}

.dice-face-right {
  transform: rotateY(90deg) translateZ(50rpx);
}

.dice-face-left {
  transform: rotateY(-90deg) translateZ(50rpx);
}

.dice-face-top {
  transform: rotateX(90deg) translateZ(50rpx);
}

.dice-face-bottom {
  transform: rotateX(-90deg) translateZ(50rpx);
}

.dot {
  position: absolute;
  width: 20rpx;
  height: 20rpx;
  background: radial-gradient(circle at 30% 30%, #555, #222);
  border-radius: 50%;
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.4);
}

.dot-center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.dot-top-left {
  top: 15rpx;
  left: 15rpx;
}

.dot-top-right {
  top: 15rpx;
  right: 15rpx;
}

.dot-middle-left {
  top: 50%;
  left: 15rpx;
  transform: translateY(-50%);
}

.dot-middle-right {
  top: 50%;
  right: 15rpx;
  transform: translateY(-50%);
}

.dot-bottom-left {
  bottom: 15rpx;
  left: 15rpx;
}

.dot-bottom-right {
  bottom: 15rpx;
  right: 15rpx;
}

.roll-result {
  font-size: 30rpx;
  color: #ffd700;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.btn-roll {
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
  color: white;
  padding: 24rpx 60rpx;
  font-size: 30rpx;
  box-shadow: 0 4px 20px rgba(236, 72, 153, 0.4);
}

.btn-roll:active {
  transform: scale(0.95);
}

.phase-selecting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.hint-text {
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.sub-hint {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.phase-pulling {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.action-hint {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
}

.progress-track {
  width: 80%;
  height: 16rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e 0%, #f59e0b 50%, #ef4444 100%);
  border-radius: 8rpx;
  transition: width 0.05s linear;
}

.action-buttons {
  display: flex;
  gap: 30rpx;
  margin-top: 10rpx;
}

.btn {
  padding: 24rpx 50rpx;
  border-radius: 50rpx;
  font-size: 30rpx;
  border: none;
  font-weight: 600;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn-pull {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
}

.btn-pull:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  backdrop-filter: blur(10px);
}

.btn-cancel:active {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(0.95);
}

.phase-placing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.btn-place {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 28rpx 60rpx;
  font-size: 32rpx;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.btn-place:active {
  transform: scale(0.95);
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
}

.phase-falling {
  text-align: center;
}

.fall-text {
  font-size: 40rpx;
  color: #f87171;
  font-weight: bold;
  animation: fallText 0.5s ease-in-out infinite;
}

@keyframes fallText {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.phase-gameover {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.gameover-title {
  font-size: 48rpx;
  color: #ef4444;
  font-weight: bold;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
}

.final-stats {
  display: flex;
  gap: 60rpx;
  margin: 10rpx 0;
}

.final-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.final-stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.final-stat-value {
  font-size: 44rpx;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.gameover-buttons {
  display: flex;
  gap: 20rpx;
  margin-top: 10rpx;
}

.btn-restart {
  background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
  color: white;
  padding: 24rpx 50rpx;
  font-size: 28rpx;
  box-shadow: 0 4px 20px rgba(236, 72, 153, 0.4);
}

.btn-restart:active {
  transform: scale(0.95);
  box-shadow: 0 2px 10px rgba(236, 72, 153, 0.3);
}

.btn-switch {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 24rpx 40rpx;
  font-size: 28rpx;
  backdrop-filter: blur(10px);
}

.btn-switch:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.25);
}
</style>
