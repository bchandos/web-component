const BASE_URL = 'http://192.168.0.154:3000'

class DynamicWidget extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const myDiv = document.createElement('div');
    shadow.appendChild(myDiv);
  }

  connectedCallback() {
    this.loadInitalContents();
  }
  
  async loadInitalContents() {
    await this._loadContents();
  }

  async reloadContents(argObj) {
    for (let k of Object.getOwnPropertyNames(argObj)) {
      this.dataset[k] = argObj[k];
    }
    await this._loadContents();
  }

  async _loadContents() {
    const dwName = this.getAttribute('name');
    if (this.hasAttribute('elem') && this.getAttribute('elem') !== 'div') {
      this.shadowRoot.firstChild.replaceWith(document.createElement(this.getAttribute('elem')));
    }
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
    root.innerHTML = initContents.newBody;
  }
}

customElements.define('dynamic-widget', DynamicWidget);

const reloadDynamicWidget = (name, argObj) => {
  const dynamicWidget = document.querySelector(`dynamic-widget[name="${name}"]`);
  dynamicWidget.reloadContents(argObj);
}