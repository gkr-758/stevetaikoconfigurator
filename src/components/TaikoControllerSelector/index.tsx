import {
	connectedHidDevicesAtom,
	customButton1KeyAtom,
	customButton2KeyAtom,
	customButton3KeyAtom,
	customButton4KeyAtom,
	doubleSideHitDetectionAtom,
	activeConfiguratorAtom,
	hidDevicesAtom,
	keyInvokeDurationAtom,
	ledHitIndicatorAtom,
	leftDonKeyAtom,
	leftKaSensorSubtrahendAtom,
	leftKaKeyAtom,
	leftDonSensorSubtrahendAtom,
	rightDonKeyAtom,
	rightDonSensorSubtrahendAtom,
	rightKaKeyAtom,
	rightKaSensorSubtrahendAtom,
	triggerThresholdAtom,
} from "$/states/main.ts";
import { type HidDeviceDesc, HidDevice } from "$/utils/hid.ts";
import { ReloadIcon } from "@radix-ui/react-icons";
import {
	Button,
	Dialog,
	Flex,
	IconButton,
	RadioCards,
	Spinner,
	Text,
	Tooltip,
} from "@radix-ui/themes";
import { atom, useAtom, useAtomValue, useSetAtom, useStore } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

const taikoControllerSelectorOpenedAtom = atom(false);
const isOpeningAtom = atom(false);

const TaikoControllerSelectorItem = (props: {
	hidDevice: HidDeviceDesc;
	onSelected?: () => void;
}) => {
	const { t } = useTranslation();
	const store = useStore();
	const setOpened = useSetAtom(taikoControllerSelectorOpenedAtom);
	const setConnectedDevice = useSetAtom(connectedHidDevicesAtom);
	const setActiveConfigurator = useSetAtom(activeConfiguratorAtom);
	const [opening, setOpening] = useState(false);
	const connectedDevice = useAtomValue(connectedHidDevicesAtom);

	return (
		<RadioCards.Item
			style={{
				justifyContent: "flex-start",
			}}
			value={props.hidDevice.path}
			onClick={async () => {
				const currentConfigurator = store.get(activeConfiguratorAtom);
				if (currentConfigurator) {
					await currentConfigurator[Symbol.asyncDispose]();
				}
				setConnectedDevice(null);
				setOpening(true);
				try {
					const device = await HidDevice.reopenHidDevice(props.hidDevice.path);
					setConnectedDevice(props.hidDevice);
					setActiveConfigurator(new props.hidDevice.taikoClass(device));
					setOpened(false);
					props.onSelected?.();
				} catch (e) {
					console.error(e);
				} finally {
					setOpening(false);
				}
			}}
		>
			<Flex direction="column" flexGrow="1">
				<Text>{props.hidDevice.product}</Text>
				<Text size="1" color="gray">
					{t(
						"dialogs.taikoControllerSelector.item.dongleType",
						"电控型号：{dongleType}",
						{
							dongleType: props.hidDevice.taikoClass.taikoDongleName,
						},
					)}
				</Text>
				<Text size="1" color="gray">
					{t(
						"dialogs.taikoControllerSelector.item.serialNumber",
						"序列号：{serialNumber}",
						{
							serialNumber: props.hidDevice.serialNumber,
						},
					)}
				</Text>
			</Flex>
			{connectedDevice?.path === props.hidDevice.path && (
				<Text color="grass">
					<Trans i18nKey="dialogs.taikoControllerSelector.item.connected">
						已连接
					</Trans>
				</Text>
			)}
			{opening && <Spinner />}
		</RadioCards.Item>
	);
};

const isHIDSupportedAtom = atom(() => HidDevice.isSupported());

export const TaikoControllerSelector = () => {
	const store = useStore();
	const [opened, setOpened] = useAtom(taikoControllerSelectorOpenedAtom);
	const isOpening = useAtomValue(isOpeningAtom);
	const hidDevices = useAtomValue(hidDevicesAtom);
	const hidSupported = useAtomValue(isHIDSupportedAtom);
	const connectedDevice = useAtomValue(connectedHidDevicesAtom);
	const { t } = useTranslation();

	const reloadConfigurations = useCallback(async () => {
		const activeConfigurator = store.get(activeConfiguratorAtom);
		if (activeConfigurator) {
			const settings = await activeConfigurator.loadSettings();

			if (settings.ledHitIndicator !== undefined)
				store.set(ledHitIndicatorAtom, settings.ledHitIndicator);
			if (settings.doubleSideHitDetection !== undefined)
				store.set(doubleSideHitDetectionAtom, settings.doubleSideHitDetection);
			if (settings.keyInvokeDuration !== undefined)
				store.set(keyInvokeDurationAtom, settings.keyInvokeDuration);
			if (settings.triggerThreshold !== undefined)
				store.set(triggerThresholdAtom, settings.triggerThreshold);

			if (settings.sensorSubtrahends) {
				store.set(
					leftKaSensorSubtrahendAtom,
					settings.sensorSubtrahends.leftKa,
				);
				store.set(
					leftDonSensorSubtrahendAtom,
					settings.sensorSubtrahends.leftDon,
				);
				store.set(
					rightDonSensorSubtrahendAtom,
					settings.sensorSubtrahends.rightDon,
				);
				store.set(
					rightKaSensorSubtrahendAtom,
					settings.sensorSubtrahends.rightKa,
				);
			}

			if (settings.keyBindings) {
				store.set(leftKaKeyAtom, settings.keyBindings.leftKa);
				store.set(leftDonKeyAtom, settings.keyBindings.leftDon);
				store.set(rightDonKeyAtom, settings.keyBindings.rightDon);
				store.set(rightKaKeyAtom, settings.keyBindings.rightKa);
				if (settings.keyBindings.custom1 !== undefined)
					store.set(customButton1KeyAtom, settings.keyBindings.custom1);
				if (settings.keyBindings.custom2 !== undefined)
					store.set(customButton2KeyAtom, settings.keyBindings.custom2);
				if (settings.keyBindings.custom3 !== undefined)
					store.set(customButton3KeyAtom, settings.keyBindings.custom3);
				if (settings.keyBindings.custom4 !== undefined)
					store.set(customButton4KeyAtom, settings.keyBindings.custom4);
			}
		}
	}, [store]);

	useEffect(() => {
		if (opened) {
			HidDevice.getAllHidDevices().then((devices) =>
				store.set(hidDevicesAtom, devices),
			);
		}
	}, [opened, store]);

	return (
		<>
			<Dialog.Root
				open={opened}
				onOpenChange={(v) => {
					if (isOpening) return;
					setOpened(v);
				}}
			>
				<Dialog.Trigger disabled={!hidSupported}>
					<Button disabled={!hidSupported} variant="surface">
						{connectedDevice
							? t("dialogs.taikoControllerSelector.button.connected", "已连接")
							: t(
									"dialogs.taikoControllerSelector.button.selectController",
									"选择太鼓控制器",
								)}
					</Button>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Description />
					<Dialog.Title>
						<Trans i18nKey="dialogs.taikoControllerSelector.title">
							检测到的太鼓控制器
						</Trans>
					</Dialog.Title>
					<RadioCards.Root orientation="vertical">
						{hidDevices.map((d) => (
							<TaikoControllerSelectorItem
								key={d.path}
								hidDevice={d}
								onSelected={reloadConfigurations}
							/>
						))}
						{hidDevices.length === 0 && (
							<Text align="center" wrap="wrap" color="gray">
								<Trans i18nKey="dialogs.taikoControllerSelector.noControllerTip">
									未检测到太鼓控制器
									<br />
									请检查你的电脑是否正确连接到了太鼓控制器
									<br />
									且太鼓控制器已切换到键盘模式
								</Trans>
							</Text>
						)}
					</RadioCards.Root>
				</Dialog.Content>
			</Dialog.Root>
			<Tooltip
				content={t(
					"dialogs.taikoControllerSelector.button.reloadConfig",
					"重载电控配置",
				)}
				side="bottom"
			>
				<IconButton
					ml="2"
					variant="soft"
					disabled={!connectedDevice}
					onClick={reloadConfigurations}
				>
					<ReloadIcon />
				</IconButton>
			</Tooltip>
		</>
	);
};
