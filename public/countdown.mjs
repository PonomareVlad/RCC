import {LitElement, html, css} from "lit";

export class Countdown extends LitElement {

    static get properties() {
        return {
            timestamp: {type: Number},
        }
    }

    static get styles() {
        return css`

          time {
            text-align: center;
            color: var(--header-font-color);
            font-size: var(--header-font-size);
            font-weight: var(--header-font-weight);
            font-family: var(--header-font-family);
          }

          span {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
          }

          span::after {
            content: attr(title);
            display: inline-block;
            font-family: var(--font-family);
            color: var(--paragraph-font-color);
            font-size: var(--paragraph-font-size);
            font-weight: var(--paragraph-font-weight);
            margin-top: var(--countdown-paragraph-padding);
          }

        `
    }

    static define(tag = "app-countdown") {
        customElements.define(tag, this);
    }

    render() {
        const days = "00";
        const hours = "00";
        const minutes = "00";
        const seconds = "00";
        return html`
            <time>
                <span id="days" title="Дней">${days}</span>
                :
                <span id="hours" title="Часов">${hours}</span>
                :
                <span id="minutes" title="Минут">${minutes}</span>
                :
                <span id="seconds" title="Секунд">${seconds}</span>
            </time>
        `
    }

}
