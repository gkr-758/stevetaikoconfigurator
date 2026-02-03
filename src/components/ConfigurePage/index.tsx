import { Flex, Tabs, Text } from "@radix-ui/themes";
import { KeyBindingSettings } from "../KeyBindingSettings/index.tsx";
import { SensorSettings } from "../SensorSettings/index.tsx";
import { SingleLabeledSensorVisualizer } from "../SensorVisualizer/index.tsx";
import { TaikoVisualizerForKeyboard } from "../TaikoVisualizer/keyboard.tsx";
import { atom, useAtomValue } from "jotai";
import { HidDevice } from "$/utils/hid.ts";
import {
	activeConfiguratorAtom,
	connectedHidDevicesAtom,
} from "$/states/main.ts";
import { Trans } from "react-i18next";
import { FeatureSupport } from "$/taiko/base.ts";
import { useMemo } from "react";
import { TaikoCatzV4Settings } from "../TaikoCatzV4Settings/index.tsx";

const isHIDSupportedAtom = atom(() => HidDevice.isSupported());
export const ConfigurePage = () => {
	const isHidSupported = useAtomValue(isHIDSupportedAtom);
	const hidDevice = useAtomValue(connectedHidDevicesAtom);
	const configurator = useAtomValue(activeConfiguratorAtom);

	const isEnabled = !!(isHidSupported && hidDevice);

	const supportedFeatures = useMemo(
		() => configurator?.supportedFeatures() ?? new Set(),
		[configurator],
	);

	const isSensorTabSupported = useMemo(() => {
		return (
			supportedFeatures.has(FeatureSupport.SetSensorTriggerThrehold) ||
			supportedFeatures.has(FeatureSupport.SetLEDHitIndicator) ||
			supportedFeatures.has(FeatureSupport.SetBothSideHitJudge) ||
			supportedFeatures.has(FeatureSupport.SetSensorSubtrahendPerSide)
		);
	}, [supportedFeatures]);

	const isKeyBindingTabSupported = useMemo(() => {
		return (
			supportedFeatures.has(FeatureSupport.SetSensorKeyDuration) ||
			supportedFeatures.has(FeatureSupport.SetSensorKeyPerSide) ||
			supportedFeatures.has(FeatureSupport.SetCustomKey1) ||
			supportedFeatures.has(FeatureSupport.SetCustomKey2) ||
			supportedFeatures.has(FeatureSupport.SetCustomKey3) ||
			supportedFeatures.has(FeatureSupport.SetCustomKey4)
		);
	}, [supportedFeatures]);

	const isVisualizerSupported = supportedFeatures.has(
		FeatureSupport.SensorVisualization,
	);

	return (
		<Flex
			direction="column"
			align="center"
			py="5"
			gap="4"
			height="fit-content"
			style={{
				opacity: isEnabled ? 1 : 0.5,
				pointerEvents: isEnabled ? "auto" : "none",
				userSelect: isEnabled ? "auto" : "none",
			}}
		>
			{!isHidSupported && (
				<Text color="yellow" align="center" size="2">
					<Trans i18nKey="page.config.disabledTips.webHidUnsupported">
						因浏览器不支持 WebHID API ，配置页面无法使用
					</Trans>
				</Text>
			)}
			{isHidSupported && !hidDevice && (
				<Text color="yellow" align="center" size="2">
					<Trans i18nKey="page.config.disabledTips.controllerNotConnected">
						请点击左上角的按钮连接太鼓控制器
					</Trans>
				</Text>
			)}
			<Flex
				direction="row"
				align="center"
				justify="center"
				width="100%"
				height="fit-content"
			>
				<Flex gap="4" height="15em">
					{isVisualizerSupported && (
						<SingleLabeledSensorVisualizer side="leftKa" />
					)}
					{isVisualizerSupported && (
						<SingleLabeledSensorVisualizer side="leftDon" />
					)}
				</Flex>
				<TaikoVisualizerForKeyboard
					size={256}
					sampleMethod="event"
					fillColor="transparent"
					outlineColor="var(--gray-10)"
				/>
				<Flex gap="4" height="15em">
					{isVisualizerSupported && (
						<SingleLabeledSensorVisualizer side="rightDon" />
					)}
					{isVisualizerSupported && (
						<SingleLabeledSensorVisualizer side="rightKa" />
					)}
				</Flex>
			</Flex>

			{supportedFeatures?.has(FeatureSupport.TaikoCatzV4ProSupport) && (
				<TaikoCatzV4Settings />
			)}

			{(isSensorTabSupported || isKeyBindingTabSupported) && (
				<Tabs.Root
					defaultValue={isSensorTabSupported ? "sensor" : "keybinding"}
					style={{
						width: "30em",
					}}
				>
					<Tabs.List>
						{isSensorTabSupported && (
							<Tabs.Trigger value="sensor">
								<Trans i18nKey="page.config.tabs.sensor">传感设置</Trans>
							</Tabs.Trigger>
						)}
						{isKeyBindingTabSupported && (
							<Tabs.Trigger value="keybinding">
								<Trans i18nKey="page.config.tabs.keyBinding">按键设置</Trans>
							</Tabs.Trigger>
						)}
					</Tabs.List>
					{isSensorTabSupported && (
						<Tabs.Content value="sensor">
							<SensorSettings />
						</Tabs.Content>
					)}
					{isKeyBindingTabSupported && (
						<Tabs.Content value="keybinding">
							<KeyBindingSettings />
						</Tabs.Content>
					)}
				</Tabs.Root>
			)}
		</Flex>
	);
};
