export const HidContext = () => {
	// const store = useStore();

	// if (import.meta.env.TAURI_ENV_PLATFORM) {
	// 	useEffect(() => {
	// 		const interval = setInterval(async () => {
	// 			const devices = await HidDevice.getAllHidDevices();
	// 			const curDevicesPaths = new Set(
	// 				store.get(hidDevicesAtom).map((v) => v.path),
	// 			);
	// 			const newDevicesPaths = new Set(devices.map((v) => v.path));
	// 			if (!eqSet(curDevicesPaths, newDevicesPaths)) {
	// 				store.set(hidDevicesAtom, devices);
	// 			}

	// 			try {
	// 				const device = await HidDevice.getConnectedDevice();
	// 				store.set(connectedHidDevicesAtom, device);
	// 			} catch (err) {
	// 				console.warn(err);
	// 				store.set(connectedHidDevicesAtom, null);
	// 			}
	// 		}, 250);

	// 		HidDevice.getConnectedDevice().then((device) =>
	// 			store.set(connectedHidDevicesAtom, device),
	// 		);

	// 		return () => clearInterval(interval);
	// 	}, [store]);
	// }

	return null;
};
