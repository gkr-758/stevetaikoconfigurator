import { HidDevice } from "$/utils/hid";
import {
	DrumSensorValues,
	DrumSide,
	FeatureSupport,
	SensorValueUpdateEventType,
	TaikoConfiguratorBase,
	type TaikoSettings,
} from "./base";

export class SteveTaikoConV2LiteConfigurator extends TaikoConfiguratorBase {
	public static readonly taikoDongleName = "SteveTaikoCon V2 Lite";
	public static readonly supportedFeatures = new Set([
		FeatureSupport.SensorVisualization,
	]);

	public static readonly dongleHIDFilter: HIDDeviceFilter[] = [
		{
			vendorId: 0x303a,
			productId: 0x456e,
		},
	];

	constructor(hidDevice: HidDevice) {
		super(hidDevice);
		hidDevice.addEventListener("inputreport", ((
			ev: CustomEvent<HIDInputReportEvent>,
		) => {
			if (ev.detail.reportId === 0x02) {
				const data = ev.detail.data;
				console.log("Feature report data received:", data);
				// 顺序稍微有点不一样
				const sensorValues: DrumSensorValues = {
					[DrumSide.LeftDon]: data.getUint32(0, true),
					[DrumSide.LeftKa]: data.getUint32(4 * 1, true),
					[DrumSide.RightDon]: data.getUint32(4 * 2, true),
					[DrumSide.RightKa]: data.getUint32(4 * 3, true),
				};
				this.dispatchEvent(
					new CustomEvent(SensorValueUpdateEventType, { detail: sensorValues }),
				);
			}
			console.log("Input report received:", ev.detail.reportId, ev.detail.data);
		}) as EventListener);
		console.log("SteveTaikoCon V2 Lite configurator initialized.", hidDevice);
	}

	async loadSettings(): Promise<TaikoSettings> {
		return {};
	}

	async readSensorInput(): Promise<DrumSensorValues | null> {
		return null; // TODO
	}
}
