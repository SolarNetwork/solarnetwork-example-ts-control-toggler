import {
	AuthorizationV2Builder,
	SolarQueryApi,
	SolarUserApi,
} from "solarnetwork-api-core/lib/net/index.js";
import {
	ControlToggler,
	ControlCallbackFn,
	ControlValueType,
} from "solarnetwork-control-toggler";

import { SnSettingsFormElements } from "./forms";

let settingsForm: SnSettingsFormElements;

export function setupSolarNetworkIntegration(form: SnSettingsFormElements) {
	settingsForm = form;
}

let toggler: ControlToggler;

export function start(callback: ControlCallbackFn) {
	stop();

	// configure environment from host form field
	const url = new URL(settingsForm.snHost.value);
	const api = new SolarUserApi(url);
	const auth = new AuthorizationV2Builder(
		settingsForm.snToken.value,
		api.environment
	).saveSigningKey(settingsForm.snTokenSecret.value);

	let queryApi: SolarQueryApi | undefined = undefined;
	if (url.hostname === "localhost" && url.port === "9081") {
		// make query API default development port
		const queryUrl = new URL(url);
		queryUrl.port = "9082";
		queryApi = new SolarQueryApi(queryUrl);
	}

	toggler = new ControlToggler(
		api,
		auth,
		settingsForm.snNodeId.valueAsNumber,
		settingsForm.snControlId.value,
		queryApi
	);
	toggler.pendingRefreshMs = 1000;
	toggler.callback = callback;
	toggler.start();
}

export function stop() {
	if (toggler) {
		toggler.stop();
	}
}

export function update(desiredValue: ControlValueType) {
	if (!toggler) {
		return;
	}
	toggler.value(desiredValue);
}
