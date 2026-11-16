# Deploying the Everbright website

The `website` folder in this repository is the finished, ready-to-upload website.
No commands, installs or configuration are needed — contact numbers, WhatsApp,
store address and Google Maps link are already built in.

## Upload (cPanel, Hostinger, GoDaddy or any shared hosting)

1. Download this repository: **Code → Download ZIP**, then unzip it.
2. Open the `website` folder.
3. Upload **everything inside it** (not the folder itself) to the domain's web root,
   usually `public_html`. Include the hidden `.htaccess` file — in cPanel File
   Manager, turn on *Settings → Show Hidden Files* to see it.
4. Open the domain. Done.

`.htaccess` makes page links such as `/police-store` or a shared product link work
when refreshed or opened directly. Do not delete it.

## Vercel or Netlify (optional)

- **Drag and drop**: drop the `website` folder into Netlify Drop or a new Vercel
  project. The included `_redirects` / `vercel.json` handle page links.
- **Connected to GitHub** (auto-updates on every push): build command
  `npm run build`, output directory `dist`.

## Notes

- The site must be at the root of the domain (e.g. `everbright.in/`), not in a sub-folder.
- When the website is changed, the `website` folder is rebuilt with
  `npm run build:website` and pushed again; then re-upload its contents.
