import type { HidDevice } from "$/utils/hid";
import {
	DrumSide,
	FeatureSupport,
	SensorValueUpdateEventType,
	TaikoConfiguratorBase,
	type DrumSensorValues,
	type KeyboardUsage,
	type TaikoSettings,
} from "./base";

export class SteveTaikoConV1Configurator extends TaikoConfiguratorBase {
	public static readonly taikoDongleName = "SteveTaikoCon V1";
	public static readonly supportedFeatures = new Set([
		FeatureSupport.SensorVisualization,
		FeatureSupport.SetSensorTriggerThrehold,
		FeatureSupport.SetLEDHitIndicator,
		FeatureSupport.SetBothSideHitJudge,
		FeatureSupport.SetSensorSubtrahendPerSide,
		FeatureSupport.SetSensorKeyPerSide,
		FeatureSupport.SetSensorKeyDuration,
		FeatureSupport.SetCustomKey1,
		FeatureSupport.SetCustomKey2,
		FeatureSupport.SetCustomKey3,
		FeatureSupport.SetCustomKey4,
	]);

	public static readonly dongleHIDFilter: HIDDeviceFilter[] = [
		{
			vendorId: 0x303a,
			productId: 0x456d,
		},
	];

	private isDisposed = false;
	private cachedSettings: TaikoSettings = {};

	constructor(hidDevice: HidDevice) {
		super(hidDevice);
		const lastSensorValues: DrumSensorValues = {
			[DrumSide.LeftKa]: 0,
			[DrumSide.LeftDon]: 0,
			[DrumSide.RightDon]: 0,
			[DrumSide.RightKa]: 0,
		};
		const onFrame = () => {
			if (this.isDisposed) return;
			this.readSensorInput().then((data) => {
				if (data) {
					let shouldDispatch = false;
					for (const side of Object.values(DrumSide)) {
						if (data[side] !== lastSensorValues[side]) {
							shouldDispatch = true;
							lastSensorValues[side] = data[side];
						}
					}
					if (shouldDispatch)
						this.dispatchEvent(
							new CustomEvent(SensorValueUpdateEventType, { detail: data }),
						);
				}
				requestAnimationFrame(onFrame);
			});
		};
		requestAnimationFrame(onFrame);
	}

	override async loadSettings(): Promise<TaikoSettings> {
		const commonConfigReport = await this.hidDevice.receiveFeatureReport(0x11);
		if (!commonConfigReport) return {};
		const pcConfigReport = await this.hidDevice.receiveFeatureReport(0x12);
		if (!pcConfigReport) return {};

		console.log("reloading hid configuration", {
			commonConfigReport,
			pcConfigReport,
		});

		const boolFlags = commonConfigReport.getUint8(2);

		this.cachedSettings = {
			ledHitIndicator: !!(boolFlags & 0b01),
			doubleSideHitDetection: !!(boolFlags & 0b10),
			keyInvokeDuration: commonConfigReport.getUint16(3, true),
			triggerThreshold: commonConfigReport.getUint16(5, true),
			sensorSubtrahends: {
				leftKa: commonConfigReport.getUint16(7, true),
				leftDon: commonConfigReport.getUint16(9, true),
				rightDon: commonConfigReport.getUint16(11, true),
				rightKa: commonConfigReport.getUint16(13, true),
			},
			keyBindings: {
				leftKa: pcConfigReport.getUint8(1) as KeyboardUsage,
				leftDon: pcConfigReport.getUint8(2) as KeyboardUsage,
				rightDon: pcConfigReport.getUint8(3) as KeyboardUsage,
				rightKa: pcConfigReport.getUint8(4) as KeyboardUsage,
				custom1: pcConfigReport.getUint8(5) as KeyboardUsage,
				custom2: pcConfigReport.getUint8(6) as KeyboardUsage,
				custom3: pcConfigReport.getUint8(7) as KeyboardUsage,
				custom4: pcConfigReport.getUint8(8) as KeyboardUsage,
			},
		};
		return this.cachedSettings;
	}

	override async saveSettings(): Promise<void> {
		const { cachedSettings } = this;
		console.log("saving hid configuration", { cachedSettings });

		const commonConfigReport = await this.hidDevice.receiveFeatureReport(0x11);
		if (commonConfigReport) {
			let flags = commonConfigReport.getUint8(2);
			if (cachedSettings.ledHitIndicator !== undefined) {
				if (cachedSettings.ledHitIndicator) flags |= 0b01;
				else flags &= ~0b01;
			}
			if (cachedSettings.doubleSideHitDetection !== undefined) {
				if (cachedSettings.doubleSideHitDetection) flags |= 0b10;
				else flags &= ~0b10;
			}
			commonConfigReport.setUint8(2, flags);

			if (cachedSettings.keyInvokeDuration !== undefined) {
				commonConfigReport.setUint16(3, cachedSettings.keyInvokeDuration, true);
			}
			if (cachedSettings.triggerThreshold !== undefined) {
				commonConfigReport.setUint16(5, cachedSettings.triggerThreshold, true);
			}
			if (cachedSettings.sensorSubtrahends) {
				commonConfigReport.setUint16(
					7,
					cachedSettings.sensorSubtrahends.leftKa,
					true,
				);
				commonConfigReport.setUint16(
					9,
					cachedSettings.sensorSubtrahends.leftDon,
					true,
				);
				commonConfigReport.setUint16(
					11,
					cachedSettings.sensorSubtrahends.rightDon,
					true,
				);
				commonConfigReport.setUint16(
					13,
					cachedSettings.sensorSubtrahends.rightKa,
					true,
				);
			}
			await this.hidDevice.sendFeatureReport(commonConfigReport);
		}

		const pcConfigReport = await this.hidDevice.receiveFeatureReport(0x12);
		if (pcConfigReport) {
			if (cachedSettings.keyBindings) {
				pcConfigReport.setUint8(1, cachedSettings.keyBindings.leftKa);
				pcConfigReport.setUint8(2, cachedSettings.keyBindings.leftDon);
				pcConfigReport.setUint8(3, cachedSettings.keyBindings.rightDon);
				pcConfigReport.setUint8(4, cachedSettings.keyBindings.rightKa);
				if (cachedSettings.keyBindings.custom1 !== undefined)
					pcConfigReport.setUint8(5, cachedSettings.keyBindings.custom1);
				if (cachedSettings.keyBindings.custom2 !== undefined)
					pcConfigReport.setUint8(6, cachedSettings.keyBindings.custom2);
				if (cachedSettings.keyBindings.custom3 !== undefined)
					pcConfigReport.setUint8(7, cachedSettings.keyBindings.custom3);
				if (cachedSettings.keyBindings.custom4 !== undefined)
					pcConfigReport.setUint8(8, cachedSettings.keyBindings.custom4);
			}
			await this.hidDevice.sendFeatureReport(pcConfigReport);
		}
	}

	override async setTriggerThreshold(value: number): Promise<void> {
		this.cachedSettings.triggerThreshold = value;
	}

	override async setBothSideHitJudge(enabled: boolean): Promise<void> {
		this.cachedSettings.doubleSideHitDetection = enabled;
	}

	override async setLedHitIndicator(enabled: boolean): Promise<void> {
		this.cachedSettings.ledHitIndicator = enabled;
	}

	override async setSensorSubtrahend(
		side: DrumSide,
		value: number,
	): Promise<void> {
		if (this.cachedSettings.sensorSubtrahends) {
			this.cachedSettings.sensorSubtrahends[side] = value;
		}
	}

	override async setKeyInvokeDuration(value: number): Promise<void> {
		this.cachedSettings.keyInvokeDuration = value;
	}

	override async setKeyBinding(
		side: DrumSide,
		key: KeyboardUsage,
	): Promise<void> {
		if (this.cachedSettings.keyBindings) {
			this.cachedSettings.keyBindings[side] = key;
		}
	}

	override async setCustomKeyBinding(
		index: 1 | 2 | 3 | 4,
		key: KeyboardUsage,
	): Promise<void> {
		if (this.cachedSettings.keyBindings) {
			if (index === 1) this.cachedSettings.keyBindings.custom1 = key;
			if (index === 2) this.cachedSettings.keyBindings.custom2 = key;
			if (index === 3) this.cachedSettings.keyBindings.custom3 = key;
			if (index === 4) this.cachedSettings.keyBindings.custom4 = key;
		}
	}

	private async readSensorInput(): Promise<DrumSensorValues | null> {
		const rawData = await this.hidDevice.receiveFeatureReport(0x10);
		if (rawData === null) return null;
		return {
			[DrumSide.LeftKa]: rawData.getUint32(1, true),
			[DrumSide.LeftDon]: rawData.getUint32(1 + 4, true),
			[DrumSide.RightDon]: rawData.getUint32(1 + 4 * 2, true),
			[DrumSide.RightKa]: rawData.getUint32(1 + 4 * 3, true),
		};
	}

	async [Symbol.asyncDispose]() {
		this.isDisposed = true;
		await super[Symbol.asyncDispose]();
	}
}
