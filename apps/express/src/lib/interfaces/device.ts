export interface DeviceInfo {
  device: Device;
  name: string;
}

export interface Device {
  ScalarCmd: ScalarCmd[];
  SensorReadCmd: SensorReadCmd[];
  StopDeviceCmd: StopDeviceCmd;
}

export interface ScalarCmd {
  FeatureDescriptor: string;
  ActuatorType: string;
  StepCount: number;
}

export interface SensorReadCmd {
  FeatureDescriptor: string;
  SensorType: string;
  SensorRange: Array<number[]>;
}

export interface StopDeviceCmd {}
