import {Config, Connect, ConnectEvents} from "@vkontakte/superappkit";

/**
 * @typedef {import("@vkontakte/superappkit").VKAuthButtonCallbackResult} VKAuthButtonCallbackResult
 */

Config.init({
    appId: 51715827,

    appSettings: {
        agreements: '',
        promo: '',
        vkc_behavior: '',
        vkc_auth_action: '',
        vkc_brand: '',
        vkc_display_mode: '',
    },
});

const oneTapButton = Connect.buttonOneTapAuth({
    callback: (/** @type {VKAuthButtonCallbackResult} */ event) => {
        const {type} = event;

        if (!type) {
            return;
        }

        switch (type) {
            case ConnectEvents.OneTapAuthEventsSDK.LOGIN_SUCCESS: // = 'VKSDKOneTapAuthLoginSuccess'
                console.log(event);
                return;
            // Для этих событий нужно открыть полноценный VK ID чтобы
            // пользователь дорегистрировался или подтвердил телефон
            case ConnectEvents.OneTapAuthEventsSDK.FULL_AUTH_NEEDED: //  = 'VKSDKOneTapAuthFullAuthNeeded'
            case ConnectEvents.OneTapAuthEventsSDK.PHONE_VALIDATION_NEEDED: // = 'VKSDKOneTapAuthPhoneValidationNeeded'
            case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN: // = 'VKSDKButtonOneTapAuthShowLogin'
                // url - строка с url, на который будет произведён редирект после авторизации.
                // state - состояние вашего приложение или любая произвольная строка, которая будет добавлена к url после авторизации.
                return Connect.redirectAuth({url: 'https://ekaterinburg.vercel.app', state: 'dj29fnsadjsd82...'});
            // Пользователь перешел по кнопке "Войти другим способом"
            case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN_OPTIONS: // = 'VKSDKButtonOneTapAuthShowLoginOptions'
                // Параметр screen: phone позволяет сразу открыть окно ввода телефона в VK ID
                // Параметр url: ссылка для перехода после авторизации. Должен иметь https схему. Обязательный параметр.
                return Connect.redirectAuth({screen: 'phone', url: 'https://ekaterinburg.vercel.app'});
        }

        return;
    },
    // Не обязательный параметр с настройками отображения OneTap
    options: {
        showAlternativeLogin: false,
        showAgreements: false,
        displayMode: 'default',
        langId: 0,
        buttonSkin: 'flat',
        buttonStyles: {
            borderRadius: 8,
            height: 50,
        },
    },
});

// Получить iframe можно с помощью метода getFrame()
if (oneTapButton) {
    document.querySelector(".auth").appendChild(oneTapButton.getFrame());
}

// Удалить iframe можно с помощью OneTapButton.destroy();
