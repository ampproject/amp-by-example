import params from '../params/base.js';

export default function createSelector(container, config) {
  return new Selector(container, config, document);
}

class Selector {
  constructor(container, config, doc) {
    this.container = container;
    this.config = config;
    this.doc = doc;
  }

  show() {
    this.select = this.doc.createElement('select');
    this.select.setAttribute('aria-label', this.config.label);
    this.config.classes.forEach(c => this.select.classList.add(c));
    if (this.config.id) {
      this.select.setAttribute('id', this.config.id);
    }
    this.select.addEventListener('change', () => {
      params.replace('runtime', this.select.value);
      this.config.onChange(this.select.value);
    });
    this.config.values.forEach(value => {
      const option = this.doc.createElement('option');
      option.setAttribute('value', value.id);
      if (value.selected) {
        option.setAttribute('selected', null);
      }
      option.innerHTML = value.label;
      this.select.appendChild(option);
    });

    this.container.appendChild(this.select);
  }
}
