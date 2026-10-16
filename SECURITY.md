# Security

## Report a problem

If you find a security problem in hlmnhkl/ui, please report it privately, not in a public issue:

1. Go to the [Security tab](https://github.com/hilmanhaikal/hlmnhkl-ui/security) of this repo.
2. Click **Report a vulnerability** and describe what you found and how to see it.

You will get a reply within 7 days. Once it is fixed, the fix goes out as a new version on npm and is named in the [changelog](CHANGELOG.md).

## Versions

Only the newest version gets fixes. Update with:

```sh
npx hlmnhkl-ui@latest add <name> --overwrite
```

`--overwrite` replaces the copied files, so check your own changes to them first.

## Good to know

- The npm package has no runtime dependencies. `npx hlmnhkl-ui` runs only the code in this repo.
- The add command only copies files into the folder you choose. It makes no network calls and runs no other programs.
- RichTextEditor cleans HTML in the browser. Clean saved HTML again on your server before you show it to other people.
