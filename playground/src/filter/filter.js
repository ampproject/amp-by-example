import Wade from 'wade';
import debounce from '../debounce/debounce.js';

const MIN_SEARCH_LENGTH = 3;
const CSS_FILTER_RULE = 'filtered';

export default class Filter {
  constructor(strings, input, elements) {
    this.search = Wade(strings);
    this.elements = elements;
    this.input = input;
    this.input.addEventListener('input', debounce(this.doFilter.bind(this), 200));
  }

  doFilter() {
    const searchInput = this.input.value.trim();
    if (searchInput.length < MIN_SEARCH_LENGTH) {
      this.clear();
      return;
    }
    const results = this.search(searchInput);

    const mapping = new Set();
    results.forEach(r => {
      mapping.add(r.index);
    });

    this.elements.forEach((e, index) => {
      e.classList.toggle(CSS_FILTER_RULE, !mapping.has(index));
    });
  }

  clear() {
    this.elements.forEach(e => {
      e.classList.toggle(CSS_FILTER_RULE, false);
    });
  }
}
