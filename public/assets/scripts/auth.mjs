const url = new URL("/", location);
const {searchParams} = new URL(location);
const {Config, Connect, ConnectEvents} = window.SuperAppKit;

export function auth(container, params = {}, options = {}, payload = {}) {

    return new Promise(resolve => {

        if (searchParams.has("payload"))
            return resolve(JSON.parse(searchParams.get("payload")));

        const callback = /** @type {VKAuthButtonCallbackResult} */event => {

            switch (event.type) {

                case ConnectEvents.OneTapAuthEventsSDK.LOGIN_SUCCESS:
                    return resolve(event);

                case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN:
                case ConnectEvents.OneTapAuthEventsSDK.FULL_AUTH_NEEDED:
                case ConnectEvents.OneTapAuthEventsSDK.PHONE_VALIDATION_NEEDED:
                    return Connect.redirectAuth({url});

                case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN_OPTIONS:
                    return Connect.redirectAuth({screen: "phone", url});

            }

        }

        Config.init(params);
        Connect.buttonOneTapAuth({container, callback, options});

    }).then(async ({uuid, token}) => {

        const response = await fetch(`/api/auth`, {
            body: JSON.stringify({...payload, uuid, token}),
            headers: {"Content-Type": "application/json"},
            method: "POST",
        });

        const result = await response.json();
        const session = JSON.stringify({uuid, token});

        if (result?.ok) localStorage.setItem("session", session);

        return result;

    });

}
