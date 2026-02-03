import { activeConfiguratorAtom, shouldSaveConfigAtom } from "$/states/main";
import { DrumSide } from "$/taiko/base";
import {
	DrumrollLevel,
	KeyboardMapping,
	OverallSensitivity,
	TaikoCatzV4Configurator,
	type TaikoCatzV4Settings as TaikoSettingsType,
} from "$/taiko/catz-v4";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
	Callout,
	Card,
	Flex,
	HoverCard,
	IconButton,
	Select,
	Slider,
	Switch,
	Text,
} from "@radix-ui/themes";
import { useAtomValue, useSetAtom } from "jotai";
import { PropsWithChildren, ReactNode, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

const SENSITIVITY_CONFIG = [
	{ key: "leftKa", color: "blue", side: DrumSide.LeftKa },
	{ key: "leftDon", color: "red", side: DrumSide.LeftDon },
	{ key: "rightDon", color: "red", side: DrumSide.RightDon },
	{ key: "rightKa", color: "blue", side: DrumSide.RightKa },
] as const;

const DRUMROLL_PRESETS: Record<number, number> = {
	[DrumrollLevel.Fallback]: 16,
	[DrumrollLevel.Level1]: 16,
	[DrumrollLevel.Level2]: 10,
	[DrumrollLevel.Level3]: 8,
	[DrumrollLevel.Level4]: 6,
};

const LabelCard = (
	props: PropsWithChildren<{
		label: string;
		tooltip?: ReactNode;
	}>,
) => {
	return (
		<Flex direction="column" gap="1">
			<Flex justify="between" align="center">
				<Text color="gray" size="2">
					{props.label}
				</Text>
				{props.tooltip && (
					<HoverCard.Root>
						<HoverCard.Trigger>
							<IconButton variant="ghost" color="gray">
								<InfoCircledIcon />
							</IconButton>
						</HoverCard.Trigger>
						<HoverCard.Content size="1" align="center">
							{props.tooltip}
						</HoverCard.Content>
					</HoverCard.Root>
				)}
			</Flex>
			<Card>{props.children}</Card>
		</Flex>
	);
};

export const TaikoCatzV4Settings = () => {
	const { t } = useTranslation();
	const config = useAtomValue(
		activeConfiguratorAtom,
	) as TaikoCatzV4Configurator | null;

	const [settings, setSettings] = useState<TaikoSettingsType | null>(null);
	const setShouldSaveConfig = useSetAtom(shouldSaveConfigAtom);
	const [isPresetLocked, setIsPresetLocked] = useState(true);
	const [hasInitedLock, setHasInitedLock] = useState(false);

	useEffect(() => {
		if (!config) return;
		const update = () => {
			const s = config.getSettings();
			if (s) setSettings({ ...s });
		};
		update();
		config.addEventListener("settings-loaded", update);
		return () => config.removeEventListener("settings-loaded", update);
	}, [config]);

	useEffect(() => {
		if (settings && !hasInitedLock) {
			const expected = DRUMROLL_PRESETS[settings.drumrollLevel];
			if (settings.keyPressDurationMs !== expected) {
				setIsPresetLocked(false);
			}
			setHasInitedLock(true);
		}
	}, [settings, hasInitedLock]);

	const updateConfig = (changes: Partial<TaikoSettingsType>) => {
		if (!config || !settings) return;
		const newSettings = { ...settings, ...changes };
		setSettings(newSettings);
		setShouldSaveConfig(true);
		config.updateSettings(changes);
	};

	const updateSensitivity = (side: DrumSide, val: number) => {
		if (!settings) return;
		const newSens = { ...settings.sensitivity, [side]: val };
		updateConfig({ sensitivity: newSens });
	};

	if (!settings)
		return <Text>{t("page.config.taikocatzv4.loading", "正在读取配置...")}</Text>;

	return (
		<>
			<Callout.Root color="blue" mb="4">
				<Callout.Icon>
					<InfoCircledIcon />
				</Callout.Icon>
				<Callout.Text>
					<b>
					{t(
						"page.config.taikocatzv4.bannerHint.title",
						"谨慎使用：尚在开发测试阶段",
					)}
					</b>
					<br />
					{t(
						"page.config.taikocatzv4.bannerHint.detail1",
						"目前未必保证功能完善稳定，请以官方配置工具为准。",
					)}
					<br />
					{t(
						"page.config.taikocatzv4.bannerHint.detail2",
						"保存时，电控直出音频会播放5秒钟音乐，然后自动重启。再次配置需要重新连接设备。",
					)}
				</Callout.Text>
			</Callout.Root>
			<Flex
				direction={{
					initial: "column",
					sm: "row",
				}}
				gap="2"
			>
				<LabelCard
					label={t("page.config.taikocatzv4.sensitivity.label", "灵敏度")}
					tooltip={
						<Text size="2" as="div">
							<Trans i18nKey="page.config.taikocatzv4.sensitivity.tooltip">
								调整各个敲击区域的灵敏度以及整体灵敏度倍率
								<br />
								如果串音较多，可以尝试降低对应区域的灵敏度
							</Trans>
						</Text>
					}
				>
					<Flex direction="column" gap="4">
						<Flex gap="4" justify="center">
							{SENSITIVITY_CONFIG.map(({ key, color, side }) => (
								<Flex
									key={side}
									direction="column"
									align="center"
									gap="1"
									height="200px"
								>
									<Text size="1" color={color}>
										{t(`page.config.taikocatzv4.sensitivity.sides.${key}`)}
									</Text>
									<Slider
										max={16}
										min={8}
										value={[settings.sensitivity[side]]}
										onValueChange={(v) => updateSensitivity(side, v[0])}
										orientation="vertical"
									/>
									<Text size="1">{settings.sensitivity[side]}</Text>
								</Flex>
							))}
						</Flex>
						<Flex justify="between" align="center" gap="2">
							<Text size="2">
								{t("page.config.taikocatzv4.sensitivity.overall.label", "整体灵敏度")}
							</Text>
							<Select.Root
								value={settings.overallSensitivity.toString()}
								onValueChange={(v) =>
									updateConfig({ overallSensitivity: parseInt(v) })
								}
							>
								<Select.Trigger />
								<Select.Content>
									<Select.Item value={OverallSensitivity.Low.toString()}>
										{t(
											"page.config.taikocatzv4.sensitivity.overall.options.low",
											"低（0.7x）",
										)}
									</Select.Item>
									<Select.Item value={OverallSensitivity.Medium.toString()}>
										{t(
											"page.config.taikocatzv4.sensitivity.overall.options.medium",
											"中（1.0x）",
										)}
									</Select.Item>
									<Select.Item value={OverallSensitivity.High.toString()}>
										{t(
											"page.config.taikocatzv4.sensitivity.overall.options.high",
											"高（1.4x）",
										)}
									</Select.Item>
									<Select.Item value={OverallSensitivity.VeryHigh.toString()}>
										{t(
											"page.config.taikocatzv4.sensitivity.overall.options.veryHigh",
											"很高（2.0x）",
										)}
									</Select.Item>
									<Select.Item value={OverallSensitivity.Extreme.toString()}>
										{t(
											"page.config.taikocatzv4.sensitivity.overall.options.extreme",
											"极限（2.8x）",
										)}
									</Select.Item>
								</Select.Content>
							</Select.Root>
						</Flex>
					</Flex>
				</LabelCard>

				<Flex direction="column" gap="2">
					<LabelCard
						label={t("page.config.taikocatzv4.performance.label", "性能")}
						tooltip={
							<Text size="2" as="div">
								<Trans i18nKey="page.config.taikocatzv4.performance.tooltip">
									此处会影响游戏对敲击的识别稳定性以及连打性能
									<br />
									如果按键时长过长，会导致一定的延迟。如果按键时长过短，可能会导致游戏无法及时识别到输入，进而导致吃音。
									<br />
									如果不清楚如何调整的话抑或是你正在使用官方游戏软件游玩，可以使用默认的平衡性能以适用于大多数游戏情况
									<br />
									如果你使用的是模拟器游戏等
									<b>基于按键事件（或缓冲输入）</b>
									响应输入的游戏，可以设置为最低按键时长以获得最低的延迟和最好的连打体验。
								</Trans>
							</Text>
						}
					>
						<Flex direction="column" gap="2">
							<Text size="2">
								{t(
									"page.config.taikocatzv4.performance.drumrollLevel.label",
									"连打性能等级",
								)}
							</Text>
							<Select.Root
								value={settings.drumrollLevel.toString()}
								onValueChange={(v) => {
									const level = parseInt(v);
									const updates: Partial<TaikoSettingsType> = {
										drumrollLevel: level,
									};
									if (isPresetLocked) {
										updates.keyPressDurationMs = DRUMROLL_PRESETS[level];
									}
									updateConfig(updates);
								}}
							>
								<Select.Trigger />
								<Select.Content>
									<Select.Item value={DrumrollLevel.Fallback.toString()}>
										{t(
											"page.config.taikocatzv4.performance.drumrollLevel.options.fallback",
											"回退（可靠性++，连打性能--，按键时长16ms）",
										)}
									</Select.Item>
									<Select.Item value={DrumrollLevel.Level1.toString()}>
										{t(
											"page.config.taikocatzv4.performance.drumrollLevel.options.level1",
											"等级 1（可靠性+，连打性能-，按键时长16ms）",
										)}
									</Select.Item>
									<Select.Item value={DrumrollLevel.Level2.toString()}>
										{t(
											"page.config.taikocatzv4.performance.drumrollLevel.options.level2",
											"等级 2（平衡性能，按键时长10ms）",
										)}
									</Select.Item>
									<Select.Item value={DrumrollLevel.Level3.toString()}>
										{t(
											"page.config.taikocatzv4.performance.drumrollLevel.options.level3",
											"等级 3（可靠性-，连打性能+，按键时长8ms）",
										)}
									</Select.Item>
									<Select.Item value={DrumrollLevel.Level4.toString()}>
										{t(
											"page.config.taikocatzv4.performance.drumrollLevel.options.level4",
											"等级 4（可靠性--，连打性能++，按键时长6ms）",
										)}
									</Select.Item>
								</Select.Content>
							</Select.Root>
							<Text size="2" as="label">
								<Switch
									mr="2"
									checked={isPresetLocked}
									onCheckedChange={(c) => {
										setIsPresetLocked(c);
										if (c) {
											updateConfig({
												keyPressDurationMs:
													DRUMROLL_PRESETS[settings.drumrollLevel],
											});
										}
									}}
								/>
								{t(
									"page.config.taikocatzv4.performance.usePresetDrumroll",
									"使用预设连打按键时长",
								)}
							</Text>
							<Flex justify="between">
								<Text size="2">
									{t("page.config.taikocatzv4.performance.keyPressDuration", "按键时长")}
								</Text>
								<Text size="2">{settings.keyPressDurationMs}ms</Text>
							</Flex>
							<Slider
								min={2}
								max={35}
								value={[settings.keyPressDurationMs]}
								disabled={isPresetLocked}
								onValueChange={(v) =>
									updateConfig({ keyPressDurationMs: v[0] })
								}
							/>
						</Flex>
					</LabelCard>

					<LabelCard label={t("page.config.taikocatzv4.others.label", "其它")}>
						<Flex direction="column" gap="2">
							<Text size="2">
								{t(
									"page.config.taikocatzv4.others.keyboardMapping.label",
									"键位映射方案",
								)}
							</Text>
							<Select.Root
								value={settings.keyboardMapping.toString()}
								onValueChange={(v) =>
									updateConfig({ keyboardMapping: parseInt(v) })
								}
							>
								<Select.Trigger />
								<Select.Content>
									<Select.Item value={KeyboardMapping.UseDFJK.toString()}>
										{t(
											"page.config.taikocatzv4.others.keyboardMapping.options.dfjk",
											"使用 DF-JK 键位映射方案",
										)}
									</Select.Item>
									<Select.Item value={KeyboardMapping.UseZXCV.toString()}>
										{t(
											"page.config.taikocatzv4.others.keyboardMapping.options.zxcv",
											"使用 ZX-CV 键位映射方案",
										)}
									</Select.Item>
								</Select.Content>
							</Select.Root>
						</Flex>
					</LabelCard>
				</Flex>
			</Flex>
		</>
	);
};
