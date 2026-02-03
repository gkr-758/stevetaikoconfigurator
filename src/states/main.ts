import { KeyboardUsage } from "$/types/keyboard";
import type { HidDeviceDesc } from "$/utils/hid.ts";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import languageResources from "virtual:i18next-loader";
import { TaikoConfiguratorBase } from "$/taiko/base";

export const activeConfiguratorAtom = atom<TaikoConfiguratorBase | null>(null);

export { KeyboardUsage };

export const hidDevicesAtom = atom<HidDeviceDesc[]>([]);
export const connectedHidDevicesAtom = atom<HidDeviceDesc | null>(null);

// 传感器设置
export const ledHitIndicatorAtom = atom(true);
export const doubleSideHitDetectionAtom = atom(false);
export const triggerThresholdAtom = atom(1);
export const leftKaSensorSubtrahendAtom = atom(0);
export const leftDonSensorSubtrahendAtom = atom(0);
export const rightDonSensorSubtrahendAtom = atom(0);
export const rightKaSensorSubtrahendAtom = atom(0);

// 按键设置
export const keyInvokeDurationAtom = atom(16);
export const leftKaKeyAtom = atom(KeyboardUsage.KeyboardDd);
export const leftDonKeyAtom = atom(KeyboardUsage.KeyboardFf);
export const rightDonKeyAtom = atom(KeyboardUsage.KeyboardJj);
export const rightKaKeyAtom = atom(KeyboardUsage.KeyboardKk);

export const customButton1KeyAtom = atom(KeyboardUsage.KeyboardUpArrow);
export const customButton2KeyAtom = atom(KeyboardUsage.KeyboardBackspace);
export const customButton3KeyAtom = atom(KeyboardUsage.KeyboardEnter);
export const customButton4KeyAtom = atom(KeyboardUsage.KeyboardDownArrow);

export const shouldSaveConfigAtom = atom(false);

export const pageAtom = atom<"config" | "test" | "about">("config");

export const enableSoundAtom = atomWithStorage("enableSound", true);

export const languageAtom = atomWithStorage(
	"language",
	navigator.language in languageResources ? navigator.language : "zh-CN",
);
