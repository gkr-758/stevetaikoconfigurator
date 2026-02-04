import { HidDevice } from "$/utils/hid";
import { DrumSide, FeatureSupport, TaikoConfiguratorBase } from "./base";

// const kMagic = new Uint8Array([0x01, 0x53, 0x64, 0x54]);

const kSettingsHeader = new Uint8Array([
	0x53, 0x64, 0x54, 0x34, 0x20, 0x20, 0x20, 0x00, 0x00, 0x01, 0x00,
]);

// const kStorageInvalidPayload = new Uint8Array([
// 	0x53, 0x64, 0x54, 0x34, 0x20, 0x20, 0x20, 0x00, 0x00, 0x01, 0xff, 0x00, 0x00,
// 	0x00, 0x00,
// ]);

const kWriteOngoingPayload = new Uint8Array([
	0x53, 0x64, 0x54, 0x34, 0x20, 0x20, 0x20, 0x00, 0x00, 0x02, 0xff, 0x00, 0x00,
	0x00, 0x00,
]);

const kWriteSuccessPayload = new Uint8Array([
	0x53, 0x64, 0x54, 0x34, 0x20, 0x20, 0x20, 0x00, 0x00, 0x03, 0xff, 0x00, 0x00,
	0x00, 0x00,
]);

const kSettingsPayloadSize = 32;
const kCrcRegionBegin = 16;
const kCrcOffset = 12;

export enum OverallSensitivity {
	Low = 1,
	Medium = 2,
	High = 3,
	VeryHigh = 4,
	Extreme = 5,
}

export enum DrumrollLevel {
	// 16ms press preset
	Fallback = 0,
	// 16ms press preset
	Level1 = 1,
	// 10ms press preset
	Level2 = 2,
	// 8ms press preset
	Level3 = 3,
	// 6ms press preset
	Level4 = 4,
}

export enum KeyboardMapping {
	UseDFJK = 0,
	UseZXCV = 1,
}

export interface TaikoCatzV4Settings {
	sensitivity: Record<DrumSide, number>;
	overallSensitivity: OverallSensitivity;
	drumrollLevel: DrumrollLevel;
	keyPressDurationMs: number;
	keyboardMapping: KeyboardMapping;
}

export class TaikoCatzV4Configurator extends TaikoConfiguratorBase {
	public static readonly taikoDongleName = "TaikoCatz V4";
	public static readonly supportedFeatures = new Set([
		FeatureSupport.TaikoCatzV4ProSupport,
	]);

	public static readonly dongleHIDFilter: HIDDeviceFilter[] = [
		{
			vendorId: 0x16c0,
			productId: 0x27d9,
		},
	];

	private crc32(data: Uint8Array): number {
		let crc = 0xffffffff;
		for (let i = 0; i < data.length; i++) {
			crc ^= data[i];
			for (let j = 0; j < 8; j++) {
				if (crc & 1) {
					crc = (crc >>> 1) ^ 0xedb88320;
				} else {
					crc >>>= 1;
				}
			}
		}
		return (crc ^ 0xffffffff) >>> 0;
	}

	constructor(hidDevice: HidDevice) {
		super(hidDevice);
		console.log("TaikoCatzV4Configurator initialized", hidDevice);
		this.readSettings();
	}

	private settings: TaikoCatzV4Settings | null = null;

	private async readSettings(): Promise<TaikoCatzV4Settings | null> {
		const data = await this.hidDevice.receiveFeatureReport(0x01);
		console.log("Received settings data:", data);
		if (data === null) {
			console.warn("Failed to read settings from TaikoCatz V4");
			return null;
		}
		if (data.byteLength != 32) {
			console.warn("Invalid settings length from TaikoCatz V4");
			return null;
		}
		const header = new Uint8Array(data.buffer, 1, kSettingsHeader.length);
		if (!header.every((v, i) => v === kSettingsHeader[i])) {
			console.warn("Invalid settings header from TaikoCatz V4");
			return null;
		}
		const body = new DataView(data.buffer, kCrcRegionBegin);
		const crc = this.crc32(new Uint8Array(data.buffer, kCrcRegionBegin));
		const storedCrc = data.getUint32(kCrcOffset, true);
		if (crc !== storedCrc) {
			console.warn(
				"Settings CRC32 mismatch: expected",
				crc,
				"found",
				storedCrc,
			);
			return null;
		}

		if (body.getUint8(0) !== 0x01) {
			console.warn("Unexpected 0x01 byte in settings header at offset", 0);
			return null;
		}
		for (let i = 4; i < 8; i++) {
			if (body.getUint8(i) !== 0) {
				console.warn(
					"Unexpected non-zero byte in settings header at offset",
					i,
				);
				return null;
			}
		}

		// Valid settings, parse them
		this.settings = {
			keyboardMapping: body.getUint8(2) as KeyboardMapping,
			keyPressDurationMs: body.getUint8(3),
			sensitivity: {
				[DrumSide.LeftKa]: body.getUint8(8),
				[DrumSide.LeftDon]: body.getUint8(9),
				[DrumSide.RightDon]: body.getUint8(10),
				[DrumSide.RightKa]: body.getUint8(11),
			},
			overallSensitivity: body.getUint8(12) as OverallSensitivity,
			drumrollLevel: body.getUint8(13) as DrumrollLevel,
		};
		console.log("Parsed settings:", this.settings);
		this.dispatchEvent(new Event("settings-loaded"));
		return this.settings;
	}

	public getSettings(): TaikoCatzV4Settings | null {
		return this.settings;
	}

	public async updateSettings(
		changes: Partial<TaikoCatzV4Settings>,
	): Promise<void> {
		if (!this.settings) return;
		this.settings = { ...this.settings, ...changes };
	}

	public override async saveSettings(): Promise<void> {
		if (!this.settings) return;

		const buffer = new Uint8Array(kSettingsPayloadSize);
		buffer[0] = 0x01; // Report ID
		buffer.set(kSettingsHeader, 1);

		const body = new DataView(buffer.buffer, kCrcRegionBegin);

		body.setUint8(0, 0x01);
		body.setUint8(2, this.settings.keyboardMapping);
		body.setUint8(3, this.settings.keyPressDurationMs);
		body.setUint8(8, this.settings.sensitivity[DrumSide.LeftKa]);
		body.setUint8(9, this.settings.sensitivity[DrumSide.LeftDon]);
		body.setUint8(10, this.settings.sensitivity[DrumSide.RightDon]);
		body.setUint8(11, this.settings.sensitivity[DrumSide.RightKa]);
		body.setUint8(12, this.settings.overallSensitivity);
		body.setUint8(13, this.settings.drumrollLevel);

		const crc = this.crc32(new Uint8Array(buffer.buffer, kCrcRegionBegin));
		const dataView = new DataView(buffer.buffer);
		dataView.setUint32(kCrcOffset, crc, true);

		console.log("Sending settings:", buffer);
		await this.hidDevice.sendFeatureReport(buffer);

		while (true) {
			const resp = await this.hidDevice.receiveFeatureReport(0x01);
			if (resp) {
				const respBody = new Uint8Array(resp.buffer, 1);
				if (respBody.every((v, i) => v === kWriteOngoingPayload[i])) {
					console.log("Device is writing settings, waiting...");
				} else if (respBody.every((v, i) => v === kWriteSuccessPayload[i])) {
					console.log("Settings written successfully.");
					break;
				} else {
					console.warn("Unexpected response during settings write:", resp);
					break;
				}
			}
			await new Promise((r) => setTimeout(r, 100));
		}
	}
}
