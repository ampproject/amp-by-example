class TitleUpdater {

  constructor(win) {
    this.win = win;
    this.originalTitle = win.document.title;
    this.titleLabel = win.document.getElementById('document-title');
  }

  update(text) {
    this.win.requestIdleCallback(() => {
      const match = text.match(/<title[^>]*>([^<]+)<\/title>/im);
      const snippetTitle = match ? match[1] : 'untitled';
      this.titleLabel.textContent = snippetTitle;
      this.titleLabel.classList.toggle('hidden', false);
      this.win.document.title = snippetTitle + ' - ' + this.originalTitle;
    });
  }

}

export default new TitleUpdater(window);
