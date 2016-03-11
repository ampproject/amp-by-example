[![Build Status](https://travis-ci.org/ampproject/amp-by-example.svg?branch=master)](https://travis-ci.org/ampproject/amp-by-example)

#AMP by Example

[AMP by Example](http://ampbyexample.com/) is a collection of [Accelerated Mobile Pages](https://www.ampproject.org).

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

Create a new example with `gulp create`. Set the title via `--name` or `-n` and add it to an existing section using `--dest` or `-d`:

```none
$ gulp create --name amp-img --dest src/20_Components
$ vim src/20_Components/amp-img.html
```

For more descriptive example names including whitespaces use quotes:

```none
$ gulp create --name 'Hello World' --dest src/10_Introduction
$ vim src/10_Introduction/Hello_World.html
```

If you want to create a new sample category, use `--category` or `-c`. Prefix the name with two digits followed by a space to define the sort order:

```none
$ gulp create --name amp-awesome --category "50 More Awesomeness"
$ vim src/50_More_Awesomeness/amp-awesome.html
```

Run validate to validate all examples against AMP spec:

```none
$ gulp validate
```

Run build to generate all examples:

```none
$ gulp build
```

While working on an example you can start a local webserver with auto-reload by running `gulp`:

```none
$ gulp
$ open http://localhost:8000/
```

Some components, like [this one](src/30_Advanced/amp-user-notification_with_server_endpoint.html) require an additional server endpoint.

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

If your sample is using an experimental component, you can add a metadata section (`<!--- ... --->`) with the json variables `experiment` and `component`, this will skip its validation and add an experimental note with instructions to your sample:

```json
<!---{
  "experiment": true,
  "component": "amp-experimenal-component"
}--->
```

## Contributing

Please see [the CONTRIBUTING file](CONTRIBUTING.md) for information on contributing to amp-by-example.

## License

AMP by Example is made by the [AMP Project](https://www.ampproject.org/), and is licensed under the [Apache License, Version 2.0](LICENSE).
