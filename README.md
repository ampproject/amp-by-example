# IMPORTANT: AMP by Example has been merged into amp.dev. All new issues and pull requests should be created [here](https://github.com/ampproject/docs).








# AMP by Example

## Installation

1. Fork the repository.
2. Install [NodeJS](https://nodejs.org). You will need version 4.0.0 or above.
3. Install [Gulp](http://gulpjs.com/) via `npm`. You may need to use `sudo` depending on your Node installation.

  ```none
  $ npm install -g gulp
  ```

4. Set up the repository:

  ```none
  $ git clone https://github.com/YOUR_GITHUB_NAME/amp-by-example.git
  $ cd amp-by-example
  $ npm install
  ```

5. Build and run the site:

  ```none
  $ gulp
  ```

6. If everything went well, `gulp` should now be running the site on <http://localhost:8000/>

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

While working on an example you can start a local webserver with auto-reload on <http://localhost:8000/> by running `gulp`:

```none
$ gulp
```

Some components, like [amp-live-list](https://github.com/ampproject/amp-by-example/blob/master/src/20_Components/amp-live-list.html) require an additional server endpoint.

## Writing the sample

Use HTML comments (`<!-- ... -->`) to document your sample code:

```html
<!-- Look! Images in AMP. -->
<amp-img src="img/image1.jpg" width="200" height="100" layout="responsive"></amp-img>
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
<!-- This comment spans the whole following section including the two images -->
<section>
  <amp-img src="img/image1.jpg" width="200" height="100" layout="responsive"></amp-img>
  <amp-img src="img/image2.jpg" width="200" height="100" layout="responsive"></amp-img>
</section>
```

Nesting comments are not supported:

```html
<!-- A comment -->
<div>
  <!-- This does not work because the parent div has already a comment -->
  <amp-img src="img/image1.jpg" width="200" height="100" layout="responsive"></amp-img>
</div>
<div>
  <!-- Commenting inside nested tags works though -->
  <amp-img src="img/image1.jpg" width="200" height="100" layout="responsive"></amp-img>
</div>
```

If your comment spans multiple elements, wrap these in an single `div` without any attributes. The enclosing `div` tag will be hidden in source code listings:

```html
<!-- The enclosing `div` will be hidden in source code listings. -->
<div>
  <button on="tap:my-lightbox" role="button" tabindex="0">Open lightbox</button>
  <amp-lightbox id="my-lightbox" layout="nodisplay">
    <h1>Hello World!</h1>
  </amp-lightbox>
</div>
```

#### Sample Styling

Sometimes it's good to add a little bit more styling to a sample (e.g. to separate a button from an input field). To make sure that all samples have a consistent styling, please use the following CSS variables to style specific elements in your sample:

```
:root {
  --color-primary: #005AF0;
  --color-secondary: #00DCC0;
  --color-text-light: #fff;
  --color-text-dark: #000;
  --color-error: #B00020;
  --color-bg-light: #FAFAFC;

  --space-1: .5rem;  /* 8px */
  --space-2: 1rem;   /* 16px */
  --space-3: 1.5rem; /* 24px */
  --space-4: 2rem;   /* 32px */

  --box-shadow-1: 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 1px -1px rgba(0,0,0,.14), 0 1px 5px 0 rgba(0,0,0,.12);
}
```

You can use them to style your samples like this:

```
.button {
  margin: var(--space-2);
  padding: var(--space-1);
  background-color: var(--color-primary);
  color: var(--color-text-light);
}
```

Only add the ones that you need to the sample. These CSS variable declarations will be added automatically to your sample, if you use `gulp create ...` to create the sample.

**Colors**

<img width="743" alt="screenshot 2018-11-30 at 00 22 57" src="https://user-images.githubusercontent.com/380472/49258635-6aae0180-f436-11e8-8ca0-2210fd4c0a96.png">

**Spaces**

<img width="643" alt="screenshot 2018-11-30 at 00 23 08" src="https://user-images.githubusercontent.com/380472/49258634-6aae0180-f436-11e8-9716-50c69970c113.png">

#### Formatting

You can use [markdown](https://help.github.com/articles/github-flavored-markdown/) to format your documentation:

```html
<!--
  A simple [responsive](https://www.ampproject.org/docs/guides/responsive/control_layout.html)
  image - *width* and *height* are used to determine the aspect ratio.
-->
<amp-img src="img/image1.jpg" width="200" height="100" layout="responsive"></amp-img>
```

#### Notes, Warnings & Tips

There's a special markup available for callouts:

```
[tip type="default|important|note|read-on"]
Tip!
[/tip]
```

For example:

```
[tip type="important"]
Warning! This might go wrong.
[/tip]
```

#### Hints

If you'd like to add additional information about a single element inside a section, use the `<!--~ hint syntax ~-->`:

```html
<!-- A comment about the form. -->
<form method="post"
  action-xhr="https://example.com/subscribe"
  target="_top">
  <fieldset>
    <input type="text" name="username">

    <!--~ Addition explanation about the hidden field. ~-->
    <input type="hidden" name="id" value="abc">
  </fieldset>
</form>
```

This will make the `<input>` element clickable, with the additional explanation appearing on click.

#### Drafts

You can mark samples as drafts if they are still work-in-progress. This means the samples won't show up in the start page.

```yaml
<!---
draft: true
--->
```

#### Experimental Features

If your sample is using one or more experimental features, you can add a metadata section (`<!--- ... --->`) with the variable `experiments` to specify which experiments to enable. This will skip its validation and add an experimental note with instructions to your sample:

```yaml
<!---
experiments:
  - amp-experiment-name
  - amp-another-experiment
--->
```

#### Preview Mode

Visually rich examples can provide a preview mode like [this](https://ampbyexample.com/samples_templates/news_article/preview/). Enable via metadata in the sample:

```yaml
<!---
preview: default
--->
```

There is a special preview mode for AMP Ad samples:

```yaml
<!---
preview: a4a
--->
```

#### Single Column Layout

If your sample looks better with a single column layout, you can disable the code and preview columns adding the following flags to your sample file:

```yaml
<!---
hideCode: true
hidePreview: true
--->
```

#### Disabling the Playground

If it doesn't make sense for your sample to provide a playground link, you can disable it:

```yaml
<!---
disablePlayground: true
--->
```

## Running the backend server

If you need to run or write a sample that depends on the backend server, you can run a local version.

1. Install the [Google App Engine SDK for Go](https://cloud.google.com/appengine/docs/flexible/go/download).
2. Run the backend server in watch mode so it will recompile on change.

    ```none
    $ gulp backend:watch
    ```

    If you get an error message `can't find import: "golang.org/x/net/context"`, you have to manually install and configure the GO appengine environment:

    ```none
    # install the google.goland.org/appengine package
    $ go get google.golang.org/appengine
    # explicitly set the GOROOT and APPENGINE_DEV_APPSERVER env vars
    $ export GOROOT=$HOME/local/google-cloud-sdk/platform/google_appengine/goroot
    $ export APPENGINE_DEV_APPSERVER=$(which dev_appserver.py)
    ```

3. If everything went well, the full site should now be running on <http://localhost:8080/>

### Adding backend functionality

Sample specific backend endpoints should be defined in their own file, e.g. for a sample `amp-my-component.html` the backend should be `backends/amp-my-component.go`.

#### How to style examples

You can’t reference external stylesheets when creating samples. AMP by Example provides a [default styling](https://github.com/ampproject/amp-by-example/blob/master/templates/css/styles.css) for common elements (p, h1, h2, h3, a, ...) which you should use. Sample specific styles must live in the head of the document using the tag `<style amp-custom>`. Try to keep the additional CSS for samples to a minimum and use the default styles as often as possible. If you compile a sample via Gulp and run it, the default styling will be applied.

Please note: if you copy code from a sample's code section, you will not get the style that you can see in the preview section.

## Contributing

Please see [the CONTRIBUTING file](CONTRIBUTING.md) for information on contributing to amp-by-example.

## License

AMP by Example is made by the [AMP Project](https://www.ampproject.org/), and is licensed under the [Apache License, Version 2.0](LICENSE).
