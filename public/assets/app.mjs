import {Config, Connect} from "@vkontakte/superappkit";
import {LitElement, html, css} from "lit";

export class App extends LitElement {

    static properties = {
        appId: {type: Number, attribute: "app-id"},
    };

    static define(tag = "app-root") {

        customElements.define(tag, this);

    }

    connectedCallback() {

        super.connectedCallback();

        const {appId} = this;

        Config.init({appId});

    }

    render() {

        return html`
            <h1>
                <slot>🌚</slot>
            </h1>
        `;

    }

}
