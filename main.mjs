/**
 * @typedef {import("@vkontakte/superappkit").ButtonOneTapSkin} ButtonOneTapSkin
 * @typedef {import("@vkontakte/superappkit").VKAuthButtonCallbackResult} VKAuthButtonCallbackResult
 */

const {searchParams} = new URL(location);

if (searchParams.has("payload")) {

    const payload = JSON.parse(searchParams.get("payload"));

    void init(payload);

} else {

    const {Config, Connect, ConnectEvents} = window.SuperAppKit;

    const url = new URL("/", location);
    const container = document.querySelector(".auth");
    const height = getComputedStyle(container).getPropertyValue("height");
    const borderRadius = getComputedStyle(container).getPropertyValue("border-radius");

    Config.init({
        appId: 51715827,
    });

    const oneTapButton = Connect.buttonOneTapAuth({

        callback: (/** @type {VKAuthButtonCallbackResult} */ event) => {

            switch (event.type) {

                case ConnectEvents.OneTapAuthEventsSDK.LOGIN_SUCCESS:
                    oneTapButton.destroy();
                    return init(event);

                case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN:
                case ConnectEvents.OneTapAuthEventsSDK.FULL_AUTH_NEEDED:
                case ConnectEvents.OneTapAuthEventsSDK.PHONE_VALIDATION_NEEDED:
                    return Connect.redirectAuth({url});

                case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN_OPTIONS:
                    return Connect.redirectAuth({screen: "phone", url});

            }

        },

        options: {
            langId: 0,
            displayMode: "default",
            buttonSkin: /** @type {ButtonOneTapSkin} */ "flat",
            showAlternativeLogin: false,
            showAgreements: false,
            buttonStyles: {
                borderRadius,
                height,
            },
        },

        container,

    });

}

async function init(payload) {

    console.debug(payload);

    const response = await fetch(`/api/index`, {
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        method: "POST"
    });

    console.debug(await response.json());

}
