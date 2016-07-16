[![Build Status](https://travis-ci.org/ampproject/amp-by-example.svg?branch=master)](https://travis-ci.org/ampproject/amp-by-example)

#AMP by Example

[ampbyexample.com](http://ampbyexample.com/) gives you a hands-on introduction to Accelerated Mobile Pages based on code and live samples. Learn how to create websites with AMP and how to effectively make use of the different AMP components.

![Screenshot](src/img/abe_preview.png)

In case we are missing any examples, feel free to [let us know](https://github.com/ampproject/amp-by-example/issues/new). Have you got any good examples you would like to contribute? Read on, it’s very easy to add new examples.

## Installation

1. Fork the repository.
2. Install [NodeJS](https://nodejs.org).
3. Setup the repository.

```none
$ git clone https://github.com/YOUR_GITHUB_NAME/amp-by-example.git
$ cd amp-by-example
$ npm i
$ sudo npm i -g gulp
```

## Creating a new sample

Create a new example with `gulp create:sample`. Set the title via `--name` or `-n` and add it to an existing section using `--dest` or `-d`:

```none
$ gulp create:sample --name amp-img --dest src/Getting_Started
$ vim src/Getting_Started/amp-img.html
```

For more descriptive example names including whitespaces use quotes:

```none
$ gulp create:sample --name 'Hello World' --dest src/Getting_Started
$ vim src/Getting_Started/Hello_World.html
```

## Creating a new sample category

Create a new example with `gulp create:category`. Set the title via `--name` or `-n`:

```none
$ gulp create:category --name "More Awesomeness"
$ vim src/More_Awesomeness/index.json
```

Don't to forget to add a description and set the position in the *index.json* config file.

## Sample validation

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

#### Formatting

You can use [markdown](https://help.github.com/articles/github-flavored-markdown/) to format your documentation:

```html
<!--
  A simple [responsive](https://www.ampproject.org/docs/guides/responsive/control_layout.html)
  image - *width* and *height* are used to determine the aspect ratio.
-->
<amp-img src="img/image1.jpg" width=200 height=100 layout=responsive></amp-img>
```

#### Experimental components

If your sample is using an experimental component, you can add a metadata section (`<!--- ... --->`) with the JSON variables `experiment` and `component`. This will skip its validation and add an experimental note with instructions to your sample:

```json
<!---{
  "experiment": true,
  "component": "amp-experimenal-component"
}--->
```

#### Single column layout

If your sample looks better with a single column layout, you can disable the code and preview columns adding the following flags to your sample file:

```json
<!---{
  "hideCode": true,
  "hidePreview": true
}--->
```

#### Drafts

You can mark samples as drafts if they are still work-in-progress. This means the samples won't show up in the start page.

```json
<!---{
  "draft": true
}--->
```


## Contributing

Please see [the CONTRIBUTING file](CONTRIBUTING.md) for information on contributing to amp-by-example.

## License

AMP by Example is made by the [AMP Project](https://www.ampproject.org/), and is licensed under the [Apache License, Version 2.0](LICENSE).
