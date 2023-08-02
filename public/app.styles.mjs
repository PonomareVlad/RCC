import {css} from "lit";

// language=CSS
export const styles = css`

    @import "/styles/reset.css";

    main {
        display: block;
    }

    section {
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    .logo {
        margin-top: var(--logo-padding);
    }

    h1 {
        text-align: center;
        margin-top: var(--header-padding);
        color: var(--header-font-color);
        font-size: var(--header-font-size);
        font-weight: var(--header-font-weight);
        font-family: var(--header-font-family);
    }

    mark {
        background: var(--accent-gradient);
        -webkit-text-fill-color: transparent;
        -webkit-background-clip: text;
        background-clip: text;
    }

`;
