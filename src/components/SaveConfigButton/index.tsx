import {
	activeConfiguratorAtom,
	connectedHidDevicesAtom,
	customButton1KeyAtom,
	customButton2KeyAtom,
	customButton3KeyAtom,
	customButton4KeyAtom,
	doubleSideHitDetectionAtom,
	keyInvokeDurationAtom,
	ledHitIndicatorAtom,
	leftDonKeyAtom,
	leftDonSensorSubtrahendAtom,
	leftKaKeyAtom,
	leftKaSensorSubtrahendAtom,
	rightDonKeyAtom,
	rightDonSensorSubtrahendAtom,
	rightKaKeyAtom,
	rightKaSensorSubtrahendAtom,
	shouldSaveConfigAtom,
	triggerThresholdAtom,
} from "$/states/main.ts";
import { DrumSide, FeatureSupport } from "$/taiko/base.ts";
import { Button } from "@radix-ui/themes";
import { atom, useAtomValue, useStore } from "jotai";
import { useCallback } from "react";
import { Trans } from "react-i18next";

const savingConfigAtom = atom(false);

export const SaveConfigButton = () => {
	const shouldSaveConfig = useAtomValue(shouldSaveConfigAtom);
	const savingConfig = useAtomValue(savingConfigAtom);
	const hidDevice = useAtomValue(connectedHidDevicesAtom);
	const store = useStore();

	const saveConfig = useCallback(async () => {
		const activeConfigurator = store.get(activeConfiguratorAtom);
		if (!activeConfigurator) return;
		store.set(savingConfigAtom, true);
		try {
			const supported = (activeConfigurator.constructor as any)
				.supportedFeatures as Set<FeatureSupport>;

			if (supported.has(FeatureSupport.SetSensorTriggerThrehold))
				await activeConfigurator.setTriggerThreshold(
					store.get(triggerThresholdAtom),
				);
			if (supported.has(FeatureSupport.SetBothSideHitJudge))
				await activeConfigurator.setBothSideHitJudge(
					store.get(doubleSideHitDetectionAtom),
				);
			if (supported.has(FeatureSupport.SetLEDHitIndicator))
				await activeConfigurator.setLedHitIndicator(
					store.get(ledHitIndicatorAtom),
				);
			if (supported.has(FeatureSupport.SetSensorKeyDuration))
				await activeConfigurator.setKeyInvokeDuration(
					store.get(keyInvokeDurationAtom),
				);

			if (supported.has(FeatureSupport.SetSensorSubtrahendPerSide)) {
				await activeConfigurator.setSensorSubtrahend(
					DrumSide.LeftKa,
					store.get(leftKaSensorSubtrahendAtom),
				);
				await activeConfigurator.setSensorSubtrahend(
					DrumSide.LeftDon,
					store.get(leftDonSensorSubtrahendAtom),
				);
				await activeConfigurator.setSensorSubtrahend(
					DrumSide.RightDon,
					store.get(rightDonSensorSubtrahendAtom),
				);
				await activeConfigurator.setSensorSubtrahend(
					DrumSide.RightKa,
					store.get(rightKaSensorSubtrahendAtom),
				);
			}

			if (supported.has(FeatureSupport.SetSensorKeyPerSide)) {
				await activeConfigurator.setKeyBinding(
					DrumSide.LeftKa,
					store.get(leftKaKeyAtom),
				);
				await activeConfigurator.setKeyBinding(
					DrumSide.LeftDon,
					store.get(leftDonKeyAtom),
				);
				await activeConfigurator.setKeyBinding(
					DrumSide.RightDon,
					store.get(rightDonKeyAtom),
				);
				await activeConfigurator.setKeyBinding(
					DrumSide.RightKa,
					store.get(rightKaKeyAtom),
				);
			}

			if (supported.has(FeatureSupport.SetCustomKey1))
				await activeConfigurator.setCustomKeyBinding(
					1,
					store.get(customButton1KeyAtom),
				);
			if (supported.has(FeatureSupport.SetCustomKey2))
				await activeConfigurator.setCustomKeyBinding(
					2,
					store.get(customButton2KeyAtom),
				);
			if (supported.has(FeatureSupport.SetCustomKey3))
				await activeConfigurator.setCustomKeyBinding(
					3,
					store.get(customButton3KeyAtom),
				);
			if (supported.has(FeatureSupport.SetCustomKey4))
				await activeConfigurator.setCustomKeyBinding(
					4,
					store.get(customButton4KeyAtom),
				);

			await activeConfigurator.saveSettings();

			store.set(shouldSaveConfigAtom, false);
		} catch (e) {
			console.error(e);
		} finally {
			store.set(savingConfigAtom, false);
		}
	}, [store]);

	return (
		<Button
			loading={savingConfig}
			disabled={!shouldSaveConfig || !hidDevice}
			variant={shouldSaveConfig ? "solid" : "surface"}
			onClick={saveConfig}
		>
			<Trans i18nKey="topbar.saveConfigButton.label">保存设置</Trans>
		</Button>
	);
};
