import {
	Box,
	Flex,
	IconButton,
	Separator,
	Switch,
	Text,
	Tooltip,
} from "@radix-ui/themes";
import { TaikoVisualizerForKeyboard } from "../TaikoVisualizer/keyboard.tsx";
import styles from "./index.module.css";
import { ReloadIcon } from "@radix-ui/react-icons";
import { atom, useAtom } from "jotai";
import { Fragment, type ReactNode, useEffect, useMemo, useRef } from "react";
import { TaikoVisualizerForJoystick } from "../TaikoVisualizer/joystick.tsx";
import clsx from "clsx";
import { Trans, useTranslation } from "react-i18next";

const useAtomState = <T,>(value: T) =>
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useAtom(useMemo(() => atom(value), []));

const useTaikoHitState = () => {
	const [leftKa, setLeftKa] = useAtomState(0);
	const [leftDon, setLeftDon] = useAtomState(0);
	const [rightDon, setRightDon] = useAtomState(0);
	const [rightKa, setRightKa] = useAtomState(0);

	const [surfaceRendaTimes, setSurfaceRendaTimes] = useAtomState(
		[] as number[],
	);
	const [rimRendaTimes, setRimRendaTimes] = useAtomState([] as number[]);
	const [surfaceRenda, setSurfaceRenda] = useAtomState(0);
	const [rimRenda, setRimRenda] = useAtomState(0);

	const resetRef = useRef(0 as unknown as ReturnType<typeof setTimeout>);

	const resetRenda = () => {
		if (resetRef.current) {
			clearTimeout(resetRef.current);
		}
		resetRef.current = setTimeout(() => {
			setSurfaceRenda(0);
			setRimRenda(0);
		}, 2000);
	};

	const onLeftRimInvoked = () => {
		setLeftKa((v) => v + 1);
		setRimRenda((v) => v + 1);
		setRimRendaTimes((v) =>
			[...v, Date.now()].filter((t) => Date.now() - t < 1000),
		);
		resetRenda();
	};

	const onLeftSurfaceInvoked = () => {
		setLeftDon((v) => v + 1);
		setSurfaceRenda((v) => v + 1);
		setSurfaceRendaTimes((v) =>
			[...v, Date.now()].filter((t) => Date.now() - t < 1000),
		);
		resetRenda();
	};

	const onRightSurfaceInvoked = () => {
		setRightDon((v) => v + 1);
		setSurfaceRenda((v) => v + 1);
		setSurfaceRendaTimes((v) =>
			[...v, Date.now()].filter((t) => Date.now() - t < 1000),
		);
		resetRenda();
	};

	const onRightRimInvoked = () => {
		setRightKa((v) => v + 1);
		setRimRenda((v) => v + 1);
		setRimRendaTimes((v) =>
			[...v, Date.now()].filter((t) => Date.now() - t < 1000),
		);
		resetRenda();
	};

	const resetCounts = () => {
		setLeftKa(0);
		setLeftDon(0);
		setRightDon(0);
		setRightKa(0);
	};

	return {
		state: {
			leftKa,
			leftDon,
			rightDon,
			rightKa,
			surfaceRenda,
			rimRenda,
			surfaceSpeed: surfaceRendaTimes.length,
			rimSpeed: rimRendaTimes.length,
		},
		handlers: {
			onLeftRimInvoked,
			onLeftSurfaceInvoked,
			onRightSurfaceInvoked,
			onRightRimInvoked,
			resetCounts,
		},
	};
};

interface HitCountersProps {
	state: ReturnType<typeof useTaikoHitState>["state"];
	resetCounts: () => void;
}

const HitCounters = ({ state, resetCounts }: HitCountersProps) => {
	const { t } = useTranslation();
	return (
		<div className={styles.hitCounters}>
			<Tooltip
				side="bottom"
				content={t("page.test.leftKaTotalCounter.tooltip", "左鼓边敲击总计数")}
			>
				<Box className={styles.rim}>{state.leftKa}</Box>
			</Tooltip>
			<Tooltip
				side="bottom"
				content={t("page.test.leftDonTotalCounter.tooltip", "左鼓面敲击总计数")}
			>
				<Box className={styles.surface}>{state.leftDon}</Box>
			</Tooltip>
			<Tooltip
				side="bottom"
				content={t(
					"page.test.rightDonTotalCounter.tooltip",
					"右鼓面敲击总计数",
				)}
			>
				<Box className={styles.surface}>{state.rightDon}</Box>
			</Tooltip>
			<Tooltip
				side="bottom"
				content={t("page.test.rightKaTotalCounter.tooltip", "右鼓边敲击总计数")}
			>
				<Box className={styles.rim}>{state.rightKa}</Box>
			</Tooltip>
			<Tooltip
				side="bottom"
				content={t("page.test.resetCounters.tooltip", "重置计数")}
			>
				<IconButton variant="soft" onClick={resetCounts}>
					<ReloadIcon />
				</IconButton>
			</Tooltip>
		</div>
	);
};

const RendaCounters = ({
	state,
}: { state: ReturnType<typeof useTaikoHitState>["state"] }) => {
	const { t } = useTranslation();
	return (
		<div className={styles.rendaCounters}>
			<Flex gap="2" align="center" direction="column">
				<Text size="2" color="red">
					<Trans i18nKey="page.test.donRendaCounter.label">鼓面连打计数</Trans>
				</Text>
				<Box className={clsx(styles.surface, styles.renda)}>
					{state.surfaceRenda}
				</Box>
				<Box className={clsx(styles.surface, styles.renda)}>
					{t("page.test.rendaSpeed.label", "{speed} 下/秒", {
						speed: state.surfaceSpeed,
					})}
				</Box>
			</Flex>
			<Flex gap="2" align="center" direction="column">
				<Text size="2" color="blue">
					<Trans i18nKey="page.test.kaRendaCounter.label">鼓边连打计数</Trans>
				</Text>
				<Box className={clsx(styles.rim, styles.renda)}>{state.rimRenda}</Box>
				<Box className={clsx(styles.rim, styles.renda)}>
					{t("page.test.rendaSpeed.label", "{speed} 下/秒", {
						speed: state.rimSpeed,
					})}
				</Box>
			</Flex>
		</div>
	);
};

interface TestEntryUIProps {
	visualizer: ReactNode;
	title: ReactNode;
	extraControls?: ReactNode;
	state: ReturnType<typeof useTaikoHitState>["state"];
	handlers: ReturnType<typeof useTaikoHitState>["handlers"];
	opacity?: number;
	disabled?: boolean;
}

const TestEntryUI = ({
	visualizer,
	title,
	extraControls,
	state,
	handlers,
	opacity = 1,
	disabled = false,
}: TestEntryUIProps) => {
	return (
		<div
			className={styles.testEntry}
			style={{
				opacity,
				pointerEvents: disabled ? "none" : "auto",
				userSelect: disabled ? "none" : "auto",
			}}
		>
			{visualizer}
			<Flex gap="2" direction="column">
				<Text size="4" weight="bold">
					{title}
				</Text>
				{extraControls}
				<HitCounters state={state} resetCounts={handlers.resetCounts} />
			</Flex>
			<RendaCounters state={state} />
		</div>
	);
};

const KeyboardTestEntry = () => {
	const [useFrameSampleMode, setUseFrameSampleMode] = useAtomState(false);
	const { state, handlers } = useTaikoHitState();

	return (
		<TestEntryUI
			visualizer={
				<TaikoVisualizerForKeyboard
					fillColor="transparent"
					size={128}
					outlineColor="var(--gray-10)"
					sampleMethod={useFrameSampleMode ? "frame" : "event"}
					{...handlers}
				/>
			}
			title={
				<Trans i18nKey="page.test.keyboardTestEntry.label">键盘（DFJK）</Trans>
			}
			extraControls={
				<Text size="2">
					<Trans i18nKey="page.test.keyboardTestEntry.frameSampleMode.label">
						逐帧采样模式
					</Trans>
					<Switch
						ml="2"
						checked={useFrameSampleMode}
						onCheckedChange={setUseFrameSampleMode}
					/>
				</Text>
			}
			state={state}
			handlers={handlers}
		/>
	);
};

const JoystickTestEntry = ({
	playerIndex,
}: {
	playerIndex: number;
}) => {
	const { t } = useTranslation();
	const [gamepadName, setGamepadName] = useAtomState("");
	const { state, handlers } = useTaikoHitState();

	useEffect(() => {
		const onGamepadConnected = (e: GamepadEvent) => {
			if (e.gamepad.index === playerIndex) {
				setGamepadName(e.gamepad.id);
				handlers.resetCounts();
			}
		};
		const onGamepadDisconnected = (e: GamepadEvent) => {
			if (e.gamepad.index === playerIndex) {
				setGamepadName("");
				handlers.resetCounts();
			}
		};
		window.addEventListener("gamepadconnected", onGamepadConnected);
		window.addEventListener("gamepaddisconnected", onGamepadDisconnected);
		return () => {
			window.removeEventListener("gamepadconnected", onGamepadConnected);
			window.removeEventListener("gamepaddisconnected", onGamepadDisconnected);
		};
	}, [playerIndex, setGamepadName, handlers.resetCounts]);

	return (
		<TestEntryUI
			opacity={gamepadName ? 1 : 0.5}
			disabled={!gamepadName}
			visualizer={
				<TaikoVisualizerForJoystick
					fillColor="transparent"
					outlineColor="var(--gray-10)"
					size={128}
					playerIndex={playerIndex}
					{...handlers}
				/>
			}
			title={
				gamepadName ||
				t(
					"page.test.joystickTestEntry.noConnectedLabel",
					"手柄 {playerIndex} 未连接",
					{ playerIndex: playerIndex + 1 },
				)
			}
			state={state}
			handlers={handlers}
		/>
	);
};

export const TestPage = () => {
	return (
		<Flex direction="column" justify="center" align="center">
			<KeyboardTestEntry />
			{[0, 1, 2, 3].map((playerIndex) => (
				<Fragment key={playerIndex}>
					<Separator size="4" />
					<JoystickTestEntry playerIndex={playerIndex} />
				</Fragment>
			))}
		</Flex>
	);
};
