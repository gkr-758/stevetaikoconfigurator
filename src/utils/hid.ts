import { ALL_TAIKO_CONFIGURATORS } from "$/taiko";
import { TaikoConfiguratorBase } from "$/taiko/base";
import { invoke } from "@tauri-apps/api/core";

export interface HidDeviceDesc {
	manufacturer: string;
	product: string;
	serialNumber: string;
	vendorId: number;
	productId: number;
	path: string;
	taikoClass: typeof TaikoConfiguratorBase;
}

function pairTaikoClassToHidDevices(device: {
	vendorId: number;
	productId: number;
}): typeof TaikoConfiguratorBase {
	let matchedClass = TaikoConfiguratorBase;
	for (const con of ALL_TAIKO_CONFIGURATORS) {
		if (
			con.dongleHIDFilter.some(
				(filter) =>
					(filter.vendorId === device.vendorId &&
						filter.productId === device.productId) ||
					(filter.vendorId === device.vendorId && !filter.productId) ||
					(!filter.vendorId && !filter.productId),
			)
		) {
			matchedClass = con;
			break;
		}
	}
	return matchedClass;
}

export class HidDevice extends EventTarget implements AsyncDisposable {
	private _internalDevice: HIDDevice | null = null;
	private _path = "";

	public static isSupported() {
		if (import.meta.env.TAURI_ENV_PLATFORM) return true;
		return "hid" in navigator;
	}

	public static async getAllHidDevices(): Promise<HidDeviceDesc[]> {
		if (import.meta.env.TAURI_ENV_PLATFORM)
			return invoke<HidDeviceDesc[]>("get_all_hids").then((v) =>
				v.map((d) => ({
					...d,
					taikoClass: pairTaikoClassToHidDevices(d),
				})),
			);
		const filters = ALL_TAIKO_CONFIGURATORS.flatMap(
			(con) => con.dongleHIDFilter,
		);

		await navigator.hid.requestDevice({ filters });
		const devices = await navigator.hid.getDevices();
		return devices.map((device, i) => {
			return {
				manufacturer: "",
				product: device.productName,
				serialNumber: `WebHID Index ${i}`,
				vendorId: device.vendorId,
				productId: device.productId,
				path: `${i}`,
				taikoClass: pairTaikoClassToHidDevices(device),
			};
		});
	}

	public static async reopenHidDevice(devicePath: string): Promise<HidDevice> {
		if (import.meta.env.TAURI_ENV_PLATFORM) {
			await invoke<void>("reopen_device", {
				devicePath,
			});
			const instance = new HidDevice();
			instance._path = devicePath;
			return instance;
		}
		const deviceIndex = Number.parseInt(devicePath);
		const devices = await navigator.hid.getDevices();
		for (const device of devices) {
			if (device.opened) await device.close();
		}
		const device = devices[deviceIndex];
		if (!device.opened) await device.open();
		const hidDevice = new HidDevice();
		hidDevice._internalDevice = device;
		device.addEventListener("inputreport", (ev) => {
			hidDevice.dispatchEvent(new CustomEvent("inputreport", { detail: ev }));
		});
		return hidDevice;
	}

	async sendFeatureReport(value: ArrayBuffer | ArrayBufferView) {
		if (import.meta.env.TAURI_ENV_PLATFORM) {
			await invoke<void>("send_feature_report_to_hid", {
				path: this._path,
				value: Array.from(
					new Uint8Array(value instanceof ArrayBuffer ? value : value.buffer),
				),
			});
		} else if (this._internalDevice) {
			const data = new Uint8Array(
				value instanceof ArrayBuffer ? value : value.buffer,
			);
			const body = data.slice(1);
			await this._internalDevice.sendFeatureReport(data[0], body);
		}
	}

	async receiveFeatureReport(reportId: number) {
		if (import.meta.env.TAURI_ENV_PLATFORM)
			return new DataView(
				new Uint8Array(
					await invoke<number[]>("recv_feature_report_from_hid", {
						path: this._path,
						reportId,
					}),
				).buffer,
			);
		if (this._internalDevice)
			return await this._internalDevice.receiveFeatureReport(reportId);
		return null;
	}

	async [Symbol.asyncDispose]() {
		if (import.meta.env.TAURI_ENV_PLATFORM) {
			await invoke<void>("close_device", { path: this._path });
		}
		if (this._internalDevice?.opened) {
			await this._internalDevice.close();
		}
	}
}
