const BASE_URL = 'http://localhost:3000'

class DynamicWidget extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const myDiv = document.createElement('div');
    shadow.appendChild(myDiv);
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
      #mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10;
      }

      @keyframes pulse-opacity {
        0% {opacity: 0.6;}
        50% {opacity: 0.3;}
        100% {opacity: 0.6;}
      }

      .pulsing {
        animation-name: pulse-opacity;
        animation-duration: 2s;
        animation-iteration-count: infinite;
      }
    `
    shadow.appendChild(styleSheet);
  }

  connectedCallback() {
    if (this.hasAttribute('elem') && this.getAttribute('elem') !== 'div') {
      this.shadowRoot.firstChild.replaceWith(document.createElement(this.getAttribute('elem')));
    }
    this.loadInitalContents();
  }
  
  async loadInitalContents() {
    await this._loadContents();
  }

  async reloadContents(argObj, clearArgs) {
    if (clearArgs === true) {
      for (let k in this.dataset) {
        delete this.dataset[k];
      }
    }
    for (let k of Object.getOwnPropertyNames(argObj)) {
      this.dataset[k] = argObj[k];
    }
    await this._loadContents();
  }

  async _loadContents() {
    this.loadingAnimation();
    const dwName = this.getAttribute('name');
    const root = this.shadowRoot.firstChild;
    const args = { ...this.dataset }
    const url = new URL('/dynamic-widget', BASE_URL);
    url.searchParams.append('name', dwName);
    for (let k of Object.getOwnPropertyNames(args)) {
      url.searchParams.append(k, args[k]);
    }
    const response = await fetch(url);
    const initContents = await response.json();
    // Parse newBody for <script> tags to add them to the DOM manually...
    const re = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
    root.innerHTML = initContents.newBody.replace(re, '');
    const matches = initContents.newBody.matchAll(re);
    for (let match of matches) {
      const code = match[1].trim();
      const scriptTag = document.createElement('script');
      scriptTag.textContent = code;
      root.appendChild(scriptTag);
    }
    // Add newBody to the page.
    this.clearLoading();
  }

  loadingAnimation() {
    // Cover element and block input
    const root = this.shadowRoot.firstChild;
    root.style.position = 'relative';
    root.classList.add('pulsing');
    const mask = document.createElement('div');
    mask.id = 'mask';
    root.appendChild(mask);
  }

  clearLoading() {
    // Clear the loading element
    const root = this.shadowRoot.firstChild;
    root.style.position = null;
    root.classList.remove('pulsing');
    root.style.opacity = 1;
    const mask = document.getElementById('mask');
    if (mask) {
      mask.remove();
    }
  }
}

customElements.define('dynamic-widget', DynamicWidget);

const reloadDynamicWidget = (name, argObj, clearArgs=false) => {
  const dynamicWidget = document.querySelector(`dynamic-widget[name="${name}"]`);
  dynamicWidget.reloadContents(argObj, clearArgs);
}