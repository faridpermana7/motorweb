# webclientnode
node js web server with integration with local api and bmkg

GULP:
npm install --save-dev gulp gulp-cli gulp-uglify-es gulp-terser gulp-concat gulp-sourcemaps gulp-clean-css gulp-rename gulp-if del gulp-rev gulp-rev-replace gulp-htmlmin
npm install --save-dev cross-env

npm install --save-dev gulp

# install deps first
npm ci

# check port first

PS D:\project\motorweb> netstat -ano | findstr :80
  TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       4
  TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       16608
  TCP    [::]:80                [::]:0                 LISTENING       4
  TCP    [::1]:80               [::1]:51543            ESTABLISHED     4
  TCP    [::1]:80               [::1]:56719            ESTABLISHED     4
  TCP    [::1]:51543            [::1]:80               ESTABLISHED     15220
  TCP    [::1]:56719            [::1]:80               ESTABLISHED     15220

# run dev build

npx gulp clean --verbose --force
npx gulp build
npm run build

# run production build
# PowerShell
$env:NODE_ENV = 'production'
npx gulp build
# or use the buildProd task:
npx gulp buildProd


# PowerShell
open powershell as administrator
$env:NODE_ENV = 'production'
npx gulp build



# or directly
npx gulp prod


# Development: 
DEV.bat — double-click it to start the HTTPS webpack server with hot reload at https://localhost:8081/. No administrator privileges are needed; press Ctrl+C to stop it.


# Production: 
DEPLOY_AS_ADMIN.bat — right-click and choose Run as administrator. It runs npm run deploy, building the produc


# User
pfar-pfar Admin
karim-karim Cashier