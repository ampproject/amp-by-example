import './fab.css';

export default class Fab {
  constructor(container, content, action) {
    this.createFab(container, content);
    this.action = action;
    this.button.addEventListener('click', this.onClick.bind(this), false);
  }

  createFab(container, content) {
    this.button = document.createElement('div');
    this.button.setAttribute('role', 'button');
    this.button.setAttribute('tabindex', '0');
    this.button.classList.add('fab');
    this.button.innerHTML = content;
    container.appendChild(this.button);
  }

  onClick(e) {
    e.preventDefault();
    this.action(this.button);
    this.hide();
  }

  show() {
    this.button.classList.remove('hide');
    this.button.classList.add('show');
  }

  hide() {
    this.button.classList.remove('show');
    this.button.classList.add('hide');
  }
}
