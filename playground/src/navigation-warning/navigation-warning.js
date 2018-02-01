class NavigationWarning {
  constructor(win) {
    this.win = win;
  }

  enable() {
    this.win.onbeforeunload = () => true;
  }

  disable() {
    this.win.onbeforeunload = null;
  }
}

export default new NavigationWarning(window);
