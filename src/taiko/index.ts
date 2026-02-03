import { TaikoConfiguratorBase } from "./base";
import { TaikoCatzV4Configurator } from "./catz-v4";
import { SteveTaikoConV1Configurator } from "./v1";
import { SteveTaikoConV2LiteConfigurator } from "./v2-lite";

export const ALL_TAIKO_CONFIGURATORS: (typeof TaikoConfiguratorBase)[] = [
	SteveTaikoConV1Configurator,
	SteveTaikoConV2LiteConfigurator,
	TaikoCatzV4Configurator,
];
