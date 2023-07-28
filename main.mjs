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

    /*const response = await fetch(`/api/index`, {
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        method: "POST"
    });*/

    // console.debug(await response.json());

    [
        document.querySelector(".auth"),
        document.querySelector(".photos"),
        document.querySelector(".overlay"),
        document.querySelector(".decorations"),
    ].forEach(node => node.parentNode.removeChild(node));

    document.querySelector(".title").innerHTML = `ФИНАЛЬНЫЙ РАУНД`;

    const caption = Object.assign(document.createElement("div"), {
        innerHTML: `Проголосуйте за артиста,<br>чтобы увидеть результаты`,
        className: "caption"
    });

    const vote = Object.assign(document.createElement("div"), {
        className: "vote",
        innerHTML: `
    <div class="side">
            <div class="photo">
                <img src="/Klava.png" alt="Klava">
            </div>
            <div class="controls">
                <div class="name">КЛАВА КОКА</div>
                <button>За Клаву!</button>
            </div>
        </div>

        <div class="side">
            <div class="photo">
                <img src="/Niletto.png" alt="Niletto">
            </div>
            <div class="controls">
                <div class="name">NILETTO</div>
                <button>За Niletto!</button>
            </div>
        </div>
    `
    });

    document.querySelector("main").append(caption);
    document.querySelector("main").append(vote);

}
