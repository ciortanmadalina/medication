@echo off
echo ========================================
echo Medication Reminder PWA Setup
echo ========================================
echo.

echo Step 1: Generating VAPID keys...
echo.
npx web-push generate-vapid-keys > vapid-keys.txt 2>&1

echo.
echo VAPID keys have been generated!
echo.
echo Please copy the keys from vapid-keys.txt and:
echo 1. Update the .env file with your VAPID keys
echo 2. Update public/index.html line 269 with your PUBLIC key
echo.

echo Step 2: Starting Netlify Dev...
echo.
echo The app will be available at http://localhost:8888
echo.

pause

npm run dev
