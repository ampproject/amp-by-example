import buttonTemplate from './button.hbs';

export function from(element, onClickHandler) {
  element.addEventListener('click', onClickHandler);
  return new Button(element.parentNode, element);
}

export function create(container, config) {
  container.insertAdjacentHTML('afterbegin', buttonTemplate(config));
  return from(container.firstChild, config.onClick);
}

class Button {

  constructor(container, element) {
    this._element = element;
    this._container = container;
  }

  show() {
    this._element.classList.toggle('hidden', false);
    if (this._element.parentNode) {
      return this;
    }
    this._container.appendChild(this._element);
    return this;
  }

  hide() {
    if (!this._element.parentNode) {
      return;
    }
    this._element.remove();
    return this;
  }

  enable() {
    this._element.removeAttribute('disabled');
    return this;
  }

  disable() {
    this._element.setAttribute('disabled', '');
    return this;
  }

  setHtml(html) {
    this._element.innerHTML = html;
    return this;
  }

  addClass(clazz) {
    this._element.classList.toggle(clazz, true);
    return this;
  }

  removeClass(clazz) {
    this._element.classList.toggle(clazz, false);
  }
}
