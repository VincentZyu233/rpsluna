import { Choice, Outcome } from './types'

/**
 * 获取能克制目标手势的出拳（如对方出石头，我们出布）
 */
export function counterChoice(choice: Choice): Choice {
  switch (choice) {
    case 'rock':
      return 'paper'
    case 'paper':
      return 'scissors'
    case 'scissors':
      return 'rock'
  }
}

/**
 * 获取会被目标手势克制的手势（如对方出石头，剪刀会输）
 */
export function losingChoice(choice: Choice): Choice {
  switch (choice) {
    case 'rock':
      return 'scissors'
    case 'paper':
      return 'rock'
    case 'scissors':
      return 'paper'
  }
}

/**
 * 判定对局结果（以玩家视角结算）
 */
export function judge(player: Choice, ai: Choice): Outcome {
  if (player === ai) return 'draw'
  if (
    (player === 'rock' && ai === 'scissors') ||
    (player === 'scissors' && ai === 'paper') ||
    (player === 'paper' && ai === 'rock')
  ) {
    return 'win'
  }
  return 'lose'
}

export function formatChoice(choice: Choice): string {
  switch (choice) {
    case 'rock':
      return '✊ 石头'
    case 'paper':
      return '🖐️ 布'
    case 'scissors':
      return '✌️ 剪刀'
  }
}

export function formatOutcome(outcome: Outcome): string {
  switch (outcome) {
    case 'win':
      return '🎉 玩家胜！'
    case 'lose':
      return '🤖 AI 胜！'
    case 'draw':
      return '🤝 平局！'
  }
}
