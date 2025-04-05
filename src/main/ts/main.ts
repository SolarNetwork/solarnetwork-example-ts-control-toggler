import "../scss/style.scss";
import { ControlCallbackFn } from "solarnetwork-api-core/tool";
import { setupSolarNetworkIntegration, start, stop, update } from "./sn.ts";
import { SnSettingsFormElements } from "./forms";
import { replaceData } from "./utils";

const snSettingsForm =
	document.querySelector<HTMLFormElement>("#data-sn-settings")!;
const snSettings = snSettingsForm.elements as unknown as SnSettingsFormElements;

const startStopButton =
	document.querySelector<HTMLButtonElement>("#start-stop-button")!;

const controlValueContainer =
	document.querySelector<HTMLDivElement>("#control-value")!;

// populate app version and then display it
replaceData(document.querySelector<HTMLElement>("#app-version")!, {
	"app-version": APP_VERSION,
}).classList.add("d-md-block");

// if NOT hosted on a .solarnetwork.net domain, default the Host input to 'http://localhost:9081' for developers
if (window.location.host.toLowerCase().indexOf(".solarnetwork.net") < 0) {
	snSettings.snHost.value = "http://localhost:9081";
}

setupSolarNetworkIntegration(snSettings);
snSettingsForm.addEventListener("change", enableStart);

function enableStart() {
	const disabled = !(
		snSettings.snHost.value &&
		snSettings.snToken.value &&
		snSettings.snTokenSecret.value &&
		snSettings.snNodeId.value &&
		snSettings.snControlId.value
	);
	if (disabled !== startStopButton.disabled) {
		startStopButton.disabled = disabled;
		if (disabled) {
			stop();
		}
	}
	// stop any current toggler after change
	toggleStartStop(startStopButton, false);
}

function toggleStartStop(btn: HTMLButtonElement, activate: boolean) {
	if (activate) {
		start(handler);
		btn.innerText = "Stop";
		btn.classList.add("active");
	} else {
		stop();
		btn.innerText = "Start";
		btn.classList.remove("active");
	}
	updateButton.disabled = !activate;
}

startStopButton.addEventListener("click", async (event: Event) => {
	const btn = event.target as HTMLButtonElement;
	toggleStartStop(btn, !btn.classList.contains("active"));
});

const updateButton = document.querySelector<HTMLButtonElement>(
	"#update-value-button",
)!;
const desiredValueInput =
	document.querySelector<HTMLInputElement>("#desired-value")!;
const updateButtonSpinner = document.querySelector<HTMLElement>(
	"#update-value-spinner",
)!;

updateButton.addEventListener("click", () => {
	const desiredValue = desiredValueInput.value;
	if (desiredValue) {
		updateButtonSpinner.classList.remove("d-none");
		update(desiredValue);
	}
});

// callback function for ControlToggler
const handler: ControlCallbackFn = function (error?: Error) {
	if (error) {
		controlValueContainer.innerText = "" + error;
		return;
	}

	const val = this.value();

	// if change is pending, show "updating..." spinner
	if (this.hasPendingStateChange) {
		updateButtonSpinner.classList.remove("d-none");
	} else {
		updateButtonSpinner.classList.add("d-none");
	}

	controlValueContainer.classList.remove("brief-showcase");
	controlValueContainer.innerText = val !== undefined ? "" + val : "";

	// add brief-showcase class to value so UI indicates we've refreshed the shown value
	setTimeout(() => {
		controlValueContainer.classList.add("brief-showcase");
	}, 100);
};
