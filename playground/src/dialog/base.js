import './base.css';
import dialogHtml from './dialog-container.html';

export default function createDialog() {
  return new Dialog(document.body, document);
}

class Dialog {
  constructor(container, doc) {
    this.container = container;
    this.doc = doc;
  }

  open(content) {
    this.container.insertAdjacentHTML('afterbegin', dialogHtml);
    this.container.querySelector('.dialog-content').appendChild(content);
    const closeButton = this.container.querySelector('.dialog-content .close');
    closeButton.addEventListener('click', this.close.bind(this));
  }

  close() {
    const dialog = this.container.querySelector('.dialog');
    if (!dialog) {
      return;
    }
    dialog.remove();
  }
}
