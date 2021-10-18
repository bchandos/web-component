const BASE_URL = 'http://localhost:9999'

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

  async reloadContents(...args) {
    const dwName = this.getAttribute('name');
    const root = this.shadowRoot.firstChild;
    // Update this element's dataset with provided args
    // (TODO: does this prevent using attributeChangedCallback?)
    for (let k of Object.getOwnPropertyNames(args)) {
      this.dataset[k] = args[k];
    }
    let newArgs = {...this.dataset};
    const url = new URL('/dynamic-widget', BASE_URL);
    url.searchParams.append('name', dwName);
    for (let k of Object.getOwnPropertyNames(newArgs)) {
      url.searchParams.append(k, newArgs[k]);
    }
    const response = await fetch(url);
    const refreshContents = await response.json();
    root.innerHTML = refreshContents.newBody;
  }

  attributeChangedCallback() {
    console.log('An attribute has been changed!!');
  }
}

customElements.define('dynamic-widget', DynamicWidget);

const reloadDynamicWidget = (name, ...args) => {
  const dynamicWidget = document.querySelector(`dynamic-widget[name="${name}"]`);
  dynamicWidget.reloadContents(...args);
}