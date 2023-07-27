/**
 * @typedef {import("@vkontakte/superappkit").ButtonOneTapSkin} ButtonOneTapSkin
 * @typedef {import("@vkontakte/superappkit").VKAuthButtonCallbackResult} VKAuthButtonCallbackResult
 */

const {searchParams} = new URL(location);

if (searchParams.has("payload")) {

    const payload = JSON.parse(searchParams.get("payload"));

    console.debug(payload);

    alert(JSON.stringify(payload));

} else {

    const {Config, Connect, ConnectEvents} = window.SuperAppKit;

    const url = new URL("/", location);
    const container = document.querySelector(".auth");
    const height = getComputedStyle(container).getPropertyValue("height");
    const borderRadius = getComputedStyle(container).getPropertyValue("border-radius");

    console.debug({height, borderRadius});

    Config.init({
        appId: 51715827,
    });

    const oneTapButton = Connect.buttonOneTapAuth({

        callback: (/** @type {VKAuthButtonCallbackResult} */ event) => {

            console.log(event);

            switch (event.type) {

                case ConnectEvents.OneTapAuthEventsSDK.LOGIN_SUCCESS:
                    oneTapButton.destroy();
                    return alert(JSON.stringify(event));

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
