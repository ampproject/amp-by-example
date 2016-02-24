#AMP by Example

https://travis-ci.org/ampproject/amp-by-example.svg?branch=master

[AMP by Example](http://amp-by-example.appspot.com/) is a collection of [Accelerated Mobile Pages](https://www.ampproject.org).

## Installation

1. [Create a fork](https://github.com/ampproject/amp-by-example#fork-destination-box) of the repository.
2. Install [NodeJS](https://nodejs.org).
3. Setup the repository.

```none
$ git clone https://github.com/YOUR_GITHUB_NAME/amp-by-example.git
$ cd amp-by-example
$ npm i
$ sudo npm i -g gulp
```

## Creating a new sample

Create a new example with `gulp create`:

```none
$ gulp create --name amp-img
$ vim src/amp-img.html
```

For more descriptive example names with whitespaces use quotes:

```none
$ gulp create --name 'Hello World'
$ vim src/Hello_World.html
```

Run validate to test your AMP html meets the spec:

```none
$ gulp validate
```

Run build to generate all examples:

```none
$ gulp build
```

While working on an example you can start a local webserver with auto-reload by simply running
`gulp`:

```none
$ gulp
$ open http://localhost:8000/index.html
```

 Some components, like the [amp-user-notification with server endpoint](https://amp-by-example.appspot.com/amp-user-notification_with_server_enpoint.html) require an additional server endpoint.
 
## Writing the sample

Use HTML comments (`<!-- ... -->`) to document your sample code:

```html
<!-- Look! Images in AMP. -->
<amp-img src="img/image1.jpg" width=200 height=100 layout=responsive></amp-img>
```

This works for elements in the header as well:

```html
<head>
  <!-- Import the amp-youtube component -->
  <script async custom-element="amp-youtube" src="https://cdn.ampproject.org/v0/amp-youtube-0.1.js"></script>
  ...
</head>
```

Every HTML comment creates a separate example section spanning the following HTML element.

```html
<!-- This comment spans the whole following div including the two images -->
<div>
  <amp-img src="img/image1.jpg" width=200 height=100 layout=responsive></amp-img>
  <amp-img src="img/image2.jpg" width=200 height=100 layout=responsive></amp-img>
</div>
```

Nested comments are not supported:

```html
<!-- A comment -->
<div>
  <!-- This does not work -->
  <amp-img src="img/image1.jpg" width=200 height=100 layout=responsive></amp-img>
</div>
```

You can use [markdown](https://help.github.com/articles/github-flavored-markdown/) to format your documentation:

```html
<!--
  A simple [responsive](https://www.ampproject.org/docs/guides/responsive/control_layout.html)
  image - *width* and *height* are used to determine the aspect ratio.
-->
<amp-img src="img/image1.jpg" width=200 height=100 layout=responsive></amp-img>
```

## Contributing

Please see [the CONTRIBUTING file](CONTRIBUTING.md) for information on contributing to amp-by-example.

## License

AMP by Example is made by the [AMP Project](https://www.ampproject.org/), and is licensed under the [Apache License, Version 2.0](LICENSE).
