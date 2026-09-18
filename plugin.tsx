import { definePlugin } from '@jaspers-ai/sdk'
import { yields } from './sources.ts'

export default definePlugin({ id: 'fed', sources: { yields }, views: {} })
