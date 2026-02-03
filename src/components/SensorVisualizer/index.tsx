import { activeConfiguratorAtom } from "$/states/main.ts";
import { DrumSensorValues, SensorValueUpdateEventType } from "$/taiko/base";
import { Flex, Text } from "@radix-ui/themes";
import { Progress } from "@radix-ui/themes/src/index.js";
import { atom, useAtom, useAtomValue, useStore } from "jotai";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

const MAX_SENSOR_VALUE = 2000;

const DATA_OFFSET = {
	leftKa: 1,
	leftDon: 1 + 4,
	rightDon: 1 + 4 * 2,
	rightKa: 1 + 4 * 3,
} as const;

const SIDE_COLOR = {
	leftKa: "blue",
	leftDon: "red",
	rightDon: "red",
	rightKa: "blue",
} as const;

export const SingleSensorVisualizer = (props: {
	side: keyof typeof DATA_OFFSET;
}) => {
	const activeConfigurator = useAtomValue(activeConfiguratorAtom);
	const store = useStore();
	const sensorValueAtom = useMemo(() => atom(0), []);
	const [sensorValue, setSensorValue] = useAtom(sensorValueAtom);

	useEffect(() => {
		if (!activeConfigurator) return;

		const onSensorValueUpdate = (event: CustomEvent<DrumSensorValues>) => {
			const data = event.detail;
			const value = data[props.side];
			setSensorValue(Math.max(0, Math.min(value, MAX_SENSOR_VALUE)));
		};

		activeConfigurator.addEventListener(
			SensorValueUpdateEventType,
			onSensorValueUpdate as EventListener,
		);

		return () => {
			activeConfigurator.removeEventListener(
				SensorValueUpdateEventType,
				onSensorValueUpdate as EventListener,
			);
		};
	}, [activeConfigurator, props.side, store]);

	return (
		<Progress
			max={MAX_SENSOR_VALUE}
			value={sensorValue}
			color={SIDE_COLOR[props.side]}
			className="sensor-visualizer"
		/>
	);
};

export const SingleLabeledSensorVisualizer = (props: {
	side: keyof typeof DATA_OFFSET;
}) => {
	const { t } = useTranslation();
	const labelText = useMemo(() => {
		if (props.side === "leftKa") return t("common.drumSide.leftKa", "左鼓边");
		if (props.side === "leftDon") return t("common.drumSide.leftDon", "左鼓面");
		if (props.side === "rightDon")
			return t("common.drumSide.rightDon", "右鼓面");
		if (props.side === "rightKa") return t("common.drumSide.rightKa", "右鼓边");
		return props.side;
	}, [t, props.side]);

	const activeConfigurator = useAtomValue(activeConfiguratorAtom);
	const store = useStore();
	const sensorValueAtom = useMemo(() => atom(0), []);
	const [sensorValue, setSensorValue] = useAtom(sensorValueAtom);

	useEffect(() => {
		if (!activeConfigurator) return;
		const onSensorValueUpdate = (event: CustomEvent<DrumSensorValues>) => {
			const data = event.detail;
			const value = data[props.side];
			setSensorValue(Math.max(0, Math.min(value, MAX_SENSOR_VALUE)));
		};

		activeConfigurator.addEventListener(
			SensorValueUpdateEventType,
			onSensorValueUpdate as EventListener,
		);

		return () => {
			activeConfigurator.removeEventListener(
				SensorValueUpdateEventType,
				onSensorValueUpdate as EventListener,
			);
		};
	}, [activeConfigurator, props.side, store]);

	return (
		<Flex direction="column" align="center" gap="2">
			<Text size="1" color={SIDE_COLOR[props.side]}>
				{sensorValue}
			</Text>
			<Progress
				max={MAX_SENSOR_VALUE}
				value={sensorValue}
				color={SIDE_COLOR[props.side]}
				className="sensor-visualizer"
			/>
			<Text size="1" color={SIDE_COLOR[props.side]}>
				{labelText}
			</Text>
		</Flex>
	);
};

export const SensorVisualizer = () => {
	return (
		<Flex direction="row" height="20em" gap="2">
			<SingleSensorVisualizer side="leftKa" />
			<SingleSensorVisualizer side="leftDon" />
			<SingleSensorVisualizer side="rightDon" />
			<SingleSensorVisualizer side="rightKa" />
		</Flex>
	);
};
