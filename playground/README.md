# AMP by Example - Playground

## Configuring auto-import of components

The AMP by Example Playground editor automatically adds `<script>` elements for
components detected in the HTML source. For example, adding a `<amp-sidebar>`
element to the source adds the following child element to `<head>`:

```
<script async custom-element="amp-sidebar" src="https://cdn.ampproject.org/v0/amp-sidebar-0.1.js"></script>
```

The mapping of component HTML element names to versions is derived by parsing
definitions in the ampproject source on GitHub, using the GitHub API.

Use of this API requires the use of a token in order to avoid
[rate limiting associated with unauthenticated requests](https://developer.github.com/v3/#rate-limiting).

To create and store a token for a deployed instance of AMP by Example:

1.  In your GitHub profile, navigate to **Settings > Developer settings**.
1.  Click on **Personal access tokens** then **Generate new token**.
1.  No additional scopes are required before clicking **Generate token**.
1.  [Create a new entity in Datastore](https://console.cloud.google.com/datastore/entities/new):
    1.  Set the **Kind** to `GitHubApiToken`
    1.  Set the **Key identifier** to **Custom name** with value
        `GitHubApiTokenKey`
    1.  Add a property with **Name** `AuthKey` and **Value** set to the token
        obtained from GitHub.
1.  If this has been successful, no warnings will be present in the
    [logs](https://console.cloud.google.com/logs/viewer) where requests are made
    to GitHub, bearing in mind that such requests only occur daily.
