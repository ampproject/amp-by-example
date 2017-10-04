# AMP by Example API

Generates embeddable AMP source code snippets with previews. The input format follows the same rules as described [here](../README.md).

Example:

```
const abe = require('amp-by-example');
const path = require('path');

const config = {
  src: path.join(__dirname, 'src'), // root folder containing the samples
  destRoot: path.join(__dirname, 'dist'), // target folder for generated embeds
  destDir: '/embeds', // optional sub dir
  host: 'https://example.com' // this is from where the embeds are going to be served
}

abe.generatePreview(config);
```

## Embed Viewer Configuration

The embed viewer can be configured via get parameters. Currently the following options are supported:

* `active-tab`: `source|preview` [default: `source`] 
* `preview-height`: height in pixels [default: source panel height]

Example embed initially showing the preview tab with a height of 200px (note: the amp-iframe should specify the same height): 

```
<amp-iframe title="Example domain page as a placeholder"
            height="200"
            layout="fixed-height"
            sandbox="allow-scripts allow-forms allow-same-origin"
            resizable
            src="https://example.com/embeds/sample.embed.html?active-tab=preview&preview-height=200">
  <div overflow tabindex="0" role="button" aria-label="Show more">Show full code</div>
  <div placeholder></div> 
</amp-iframe>
```



