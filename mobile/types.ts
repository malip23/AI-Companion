export type CallState = 'idle' | 'connecting' | 'in-call' | 'ending'

export type VapiMessageRole = 'user' | 'assistant' | 'system'

export interface VapiMessage {
  type: 'transcript' | 'function-call' | 'hang' | 'speech-update'
  role?: VapiMessageRole
  transcript?: string
  transcriptType?: 'partial' | 'final'
}

export interface Conversation {
  callId: string
  userId: string
  transcript: string
  summary: string
  recordingUrl?: string
  createdAt: Date
  durationSeconds?: number
}

export interface PushTokenRecord {
  userId: string
  expoPushToken: string
  platform: 'ios' | 'android'
  updatedAt: Date
}
