class CodeBlock extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    // Create a container for the code block
    const container = document.createElement("div");
    container.classList.add("code-container");

    // Create a style element to load Prism.js CSS
    this.styleElement = document.createElement("style");
    shadow.appendChild(this.styleElement);
    shadow.appendChild(container);

    // Listen for changes in the color scheme preference
    this.mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
    this.mediaQueryList.addEventListener("change", this.updateTheme.bind(this));

    // Initial theme setup
    this.updateTheme();
  }

  connectedCallback() {
    // Load Prism.js script inside the shadow DOM
    if (!window.Prism) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js";
      script.onload = () => this.renderCode();
      document.head.appendChild(script);
    } else {
      this.renderCode();
    }
  }

  updateTheme() {
    const browserThemePreference = this.mediaQueryList.matches
      ? "dark"
      : "light";
    const prismTheme =
      browserThemePreference === "light" ? "prism" : "prism-okaidia";
    this.styleElement.textContent = `
        @import url('https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/${prismTheme}.min.css');
        .code-container {
          position: relative;
        }
        pre {
          margin: 0;
        }
      `;
    // Re-render the code to apply the new theme
    if (this.shadowRoot.querySelector("pre")) {
      this.renderCode();
    }
  }

  renderCode() {
    const language = this.getAttribute("language") || "javascript";
    const code = this.textContent.trim();

    // Clear the container
    const container = this.shadowRoot.querySelector(".code-container");
    container.innerHTML = "";

    // Create a pre and code element
    const pre = document.createElement("pre");
    const codeElement = document.createElement("code");
    codeElement.classList.add(`language-${language}`);
    codeElement.textContent = code;

    // Append the code element to the pre element
    pre.appendChild(codeElement);
    container.appendChild(pre);

    // Highlight the code using Prism.js
    if (window.Prism) {
      Prism.highlightElement(codeElement);
    }
  }

  disconnectedCallback() {
    // Remove the event listener when the element is removed from the DOM
    this.mediaQueryList.removeEventListener(
      "change",
      this.updateTheme.bind(this)
    );
  }
}

customElements.define("code-block", CodeBlock);
