import resources from "virtual:i18next-loader";

const DEFAULT_LANGUAGE = "zh-CN";

export const resolveSupportedLanguage = (requestedLanguage: string) => {
	if (requestedLanguage in resources) {
		return requestedLanguage;
	}

	const [requestedBaseLanguage] = requestedLanguage.split("-");
	if (!requestedBaseLanguage) {
		return DEFAULT_LANGUAGE;
	}

	const matchedLanguage = Object.keys(resources).find((languageId) => {
		return languageId.split("-")[0] === requestedBaseLanguage;
	});

	return matchedLanguage ?? DEFAULT_LANGUAGE;
};