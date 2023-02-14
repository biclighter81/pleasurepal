export interface LovenseFunctionCommand {
  action: string;
  intensity: number;
  timeSec: number;
  loopRunningSec: number;
  loopPauseSec: number;
  stopPrevious: boolean;
}
