# Webpack Setup Guide

This project has been migrated from Gulp to Webpack for better asset handling, minification, and production builds.

## Installation

First, install all dependencies:

```bash
npm install
```

## Available Commands

### Development
```bash
npm run dev           # Start webpack dev server with hot reload
npm start            # Same as above
```

### Production Build
```bash
npm run build        # Build for development
npm run build:prod   # Build optimized production bundle (minified JS/CSS)
```

### Deployment
```bash
npm run deploy       # Build production and deploy to IIS
```

## What Webpack Does

### Minification
- **JavaScript**: Minified using Terser (removes whitespace, comments, simplifies code)
- **CSS**: Minified using CSS Minimizer (removes whitespace, combines selectors)

### Asset Handling
- **Fonts**: Optimized and copied to dist/assets/fonts
- **Images**: Optimized with hash-based caching
- **Config Files**: JSON config copied to dist

### Code Splitting
- Automatically separates vendor code from app code
- Reduces duplicate code in chunks

### Output Structure
```
dist/
├── assets/
│   ├── js/
│   │   ├── app.[contenthash].js
│   │   ├── vendors.[contenthash].js
│   │   └── config.json
│   ├── css/
│   │   └── app.[contenthash].css
│   ├── fonts/
│   ├── img/
│   └── ...
├── index.html
├── pages/
│   ├── dashboard.html
│   ├── sign-in.html
│   └── ...
```

## Configuration Files

- **webpack.config.js**: Main webpack configuration
- **.babelrc**: Babel configuration for JS transpilation
- **postcss.config.js**: PostCSS configuration for CSS processing
- **deploy.js**: IIS deployment script (Windows only)

## Why Webpack?

✅ Better for static sites with multiple HTML entry points  
✅ Superior asset handling (fonts, images, CSS)  
✅ Built-in code splitting and chunking  
✅ Rich plugin ecosystem  
✅ Better production optimization  
✅ Faster build times with better caching  

## Troubleshooting

### Issue: dist folder not created
- Run `npm run build:prod` first before deploying

### Issue: Missing files in dist
- Check webpack.config.js CopyPlugin patterns

### Issue: IIS Deployment fails
- Ensure you have admin permissions
- Check IIS site/app pool names in deploy.js
- Verify IIS is installed and running

### Issue: CSS not loading in production
- Check that CSS files are in `dist/assets/css/`
- Verify HTML files have correct asset paths

## Next Steps

1. Run `npm install` to install dependencies
2. Run `npm run build:prod` to create optimized build
3. Test with `npm start` for development
4. Run `npm run deploy` to deploy to IIS
