import os
import zipfile

PUBLIC_DIR = os.path.abspath("public")

def create_apk(filename, app_name, package_name, html_source):
    apk_path = os.path.join(PUBLIC_DIR, filename)
    
    with zipfile.ZipFile(apk_path, 'w', compression=zipfile.ZIP_DEFLATED) as apk:
        # 1. AndroidManifest
        manifest_content = f"""<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="{package_name}"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/icon"
        android:label="{app_name}"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|keyboardHidden|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""
        apk.writestr("AndroidManifest.xml", manifest_content)
        
        # 2. Assets (contains the complete HTML standalone app!)
        with open(os.path.join(PUBLIC_DIR, html_source), 'r', encoding='utf-8') as f:
            html_content = f.read()
        apk.writestr("assets/index.html", html_content)
        apk.writestr(f"assets/{html_source}", html_content)
        
        # 3. Meta-inf
        manifest_mf = f"""Manifest-Version: 1.0
Created-By: 1.0 (Cinema Ghaithan APK Builder)
Built-By: Ghaithan Bahaj
Package: {package_name}
App-Name: {app_name}
"""
        apk.writestr("META-INF/MANIFEST.MF", manifest_mf)
        
        # 4. Icon
        icon_path = os.path.join(PUBLIC_DIR, "icon.svg")
        if os.path.exists(icon_path):
            with open(icon_path, 'rb') as f:
                apk.writestr("res/drawable/icon.svg", f.read())

    print(f"✅ Successfully generated APK: {apk_path} ({os.path.getsize(apk_path)} bytes)")

# Build Client APK
create_apk(
    filename="cinema-ghaithan-client.apk",
    app_name="سينما غيثان - العميل",
    package_name="com.ghaithan.cinema.client",
    html_source="client.html"
)

# Build Developer APK
create_apk(
    filename="cinema-ghaithan-developer.apk",
    app_name="استوديو غيثان - المطور",
    package_name="com.ghaithan.cinema.developer",
    html_source="developer.html"
)
