import { html_beautify } from 'js-beautify/js/lib/beautify-html.js';

const BEAUTIFY_OPTIONS = {
  indent_size: 2,
  unformatted: ['noscript', 'style'],
  'indent-char': ' ',
  'no-preserve-newlines': '',
  'extra_liners': []
};

export default function beautifyHtml(string) {
  return html_beautify(string, BEAUTIFY_OPTIONS);
}
