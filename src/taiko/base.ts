import { KeyboardUsage } from "$/types/keyboard";
import { HidDevice } from "$/utils/hid";

export { KeyboardUsage };

export interface TaikoSettings {
	triggerThreshold?: number;
	ledHitIndicator?: boolean;
	doubleSideHitDetection?: boolean;
	sensorSubtrahends?: {
		leftKa: number;
		leftDon: number;
		rightDon: number;
		rightKa: number;
	};
	keyInvokeDuration?: number;
	keyBindings?: {
		leftKa: KeyboardUsage;
		leftDon: KeyboardUsage;
		rightDon: KeyboardUsage;
		rightKa: KeyboardUsage;
		custom1?: KeyboardUsage;
		custom2?: KeyboardUsage;
		custom3?: KeyboardUsage;
		custom4?: KeyboardUsage;
	};
}

export enum FeatureSupport {
	/**
	 * 支持传感器数值可视化
	 *
	 * 如果支持该功能，TaikoConfiguratorBase 的子类将会根据 HID 设备传回的数值调用 `sensorValueUpdate` 事件
	 */
	SensorVisualization,
	/** 支持主判定阈值的配置 */
	SetSensorTriggerThrehold,
	/** 支持 LED 敲击指示灯 */
	SetLEDHitIndicator,
	/** 支持双押判定 */
	SetBothSideHitJudge,
	/** 支持每个传感数值单独调控减数 */
	SetSensorSubtrahendPerSide,
	/** 支持调节每个传感器的触发键位 */
	SetSensorKeyPerSide,
	/** 支持调节触发时长 */
	SetSensorKeyDuration,
	/** 支持配置自定义按键 1 */
	SetCustomKey1,
	/** 支持配置自定义按键 2 */
	SetCustomKey2,
	/** 支持配置自定义按键 3 */
	SetCustomKey3,
	/** 支持配置自定义按键 4 */
	SetCustomKey4,

	// TaikoCatz 猫鼓电控 V4 Pro 适配
	TaikoCatzV4ProSupport,
}

export enum DrumSide {
	LeftKa = "leftKa",
	LeftDon = "leftDon",
	RightDon = "rightDon",
	RightKa = "rightKa",
}

export const SensorValueUpdateEventType = "sensorValueUpdate";

export type DrumSensorValues = Record<DrumSide, number>;

/** 这个设备不支持该功能而提示的错误 */
export class FeatureUnsupportedError extends Error {
	constructor(featureRequired: FeatureSupport) {
		super(
			`Feature ${FeatureSupport[featureRequired]} is not supported by this device.`,
		);
	}
}

export interface ITaikoConfigurator {
	/**
	 * 这个设备支持的所有功能
	 * 将会在配置页面显示对应的配置工具
	 * 以及在指定的类中调用相应的函数来处理
	 */
	readonly supportedFeatures: Set<FeatureSupport>;
	/**
	 * 这个设备对应的 Taiko Dongle 名称
	 * 用于向用户展示设备型号
	 */
	readonly taikoDongleName: string;
	/**
	 * 这个设备对应的 HID 过滤器
	 * 用于在连接设备时识别对应的 Taiko Dongle
	 */
	readonly dongleHIDFilter: HIDDeviceFilter[];
	/**
	 * 根据 HID 设备实例创建对应的配置器实例
	 */
	new (device: HidDevice): TaikoConfiguratorBase;
}

export class TaikoConfiguratorBase
	extends EventTarget
	implements AsyncDisposable
{
	/**
	 * 这个设备支持的所有功能
	 * 将会在配置页面显示对应的配置工具
	 * 以及在指定的类中调用相应的函数来处理
	 */
	public static readonly supportedFeatures = new Set<FeatureSupport>([]);
	/**
	 * 这个设备对应的 Taiko Dongle 名称
	 * 用于向用户展示设备型号
	 */
	public static readonly taikoDongleName: string = "Unknown";
	public static readonly dongleHIDFilter: HIDDeviceFilter[] = [];

	constructor(public readonly hidDevice: HidDevice) {
		super();
	}

	public supportedFeatures(): Set<FeatureSupport> {
		return (this.constructor as typeof TaikoConfiguratorBase).supportedFeatures;
	}

	public dongleName(): string {
		return (this.constructor as typeof TaikoConfiguratorBase).taikoDongleName;
	}

	async loadSettings(): Promise<TaikoSettings> {
		return {};
	}
	async saveSettings(): Promise<void> {
		return;
	}

	async setTriggerThreshold(
		// @ts-ignore unused parameter
		value: number,
	): Promise<void> {
		throw new FeatureUnsupportedError(FeatureSupport.SetSensorTriggerThrehold);
	}

	async setBothSideHitJudge(
		// @ts-ignore unused parameter
		enabled: boolean,
	): Promise<void> {
		throw new FeatureUnsupportedError(FeatureSupport.SetBothSideHitJudge);
	}

	async setLedHitIndicator(
		// @ts-ignore unused parameter
		enabled: boolean,
	): Promise<void> {
		throw new FeatureUnsupportedError(FeatureSupport.SetLEDHitIndicator);
	}

	async setSensorSubtrahend(
		// @ts-ignore unused parameter
		side: DrumSide, // @ts-ignore unused parameter
		value: number,
	): Promise<void> {
		throw new FeatureUnsupportedError(
			FeatureSupport.SetSensorSubtrahendPerSide,
		);
	}

	async setKeyInvokeDuration(
		// @ts-ignore unused parameter
		value: number,
	): Promise<void> {
		throw new FeatureUnsupportedError(FeatureSupport.SetSensorKeyDuration);
	}

	async setKeyBinding(
		// @ts-ignore unused parameter
		side: DrumSide,
		// @ts-ignore unused parameter
		key: KeyboardUsage,
	): Promise<void> {
		throw new FeatureUnsupportedError(FeatureSupport.SetSensorKeyPerSide);
	}

	async setCustomKeyBinding(
		index: 1 | 2 | 3 | 4,
		// @ts-ignore unused parameter
		key: KeyboardUsage,
	): Promise<void> {
		switch (index) {
			case 1:
				throw new FeatureUnsupportedError(FeatureSupport.SetCustomKey1);
			case 2:
				throw new FeatureUnsupportedError(FeatureSupport.SetCustomKey2);
			case 3:
				throw new FeatureUnsupportedError(FeatureSupport.SetCustomKey3);
			case 4:
				throw new FeatureUnsupportedError(FeatureSupport.SetCustomKey4);
		}
	}

	async [Symbol.asyncDispose]() {
		await this.hidDevice[Symbol.asyncDispose]();
	}
}
