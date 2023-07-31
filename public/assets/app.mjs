import {LitElement, html, css} from "lit";

export class App extends LitElement {

    static define(tag = "app-root") {

        customElements.define(tag, this);

    }

    render() {

        return html`
            <h1>
                <slot>🌚</slot>
            </h1>
        `;

    }

}
