
export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  MISSING_ENV_VAR = "MISSING_ENV_VAR",
  DB_ERROR = "DB_ERROR",
  NOT_FOUND = "NOT_FOUND",
  ELEVENLABS_API_ERROR = "ELEVENLABS_API_ERROR",
  ELEVENLABS_AUTH_ERROR = "ELEVENLABS_AUTH_ERROR",
  ELEVENLABS_NOT_FOUND = "ELEVENLABS_NOT_FOUND",
  ELEVENLABS_QUOTA_EXCEEDED = "ELEVENLABS_QUOTA_EXCEEDED",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

export interface CallData {
  id: string;
  audio_url?: string;
  agent_id?: string;
}

export interface ElevenLabsData {
  audio_url?: string;
  transcript?: string;
  summary?: string;
  statistics?: any;
}

export interface CallAudioResponse {
  audioUrl: string;
  transcript: string;
  summary: string;
  statistics?: any;
}
