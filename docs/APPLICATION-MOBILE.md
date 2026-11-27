# Application mobile (APK Android + iOS)

L'app web est emballée avec **Capacitor** : les dossiers `android/` et `ios/` sont de vrais projets natifs qui chargent le build web (`dist/`). Identifiant : `com.dek.fitness` (`capacitor.config.ts`, à changer avant publication si besoin).

## Android (APK)
**Sans rien installer** : sur GitHub, onglet *Actions* → « Build Android APK » → *Run workflow*. À la fin, télécharge l'artefact `dek-fitness-debug-apk` (fichier `app-debug.apk`) et installe-le sur ton téléphone (autoriser les sources inconnues). Ce workflow se lance aussi à chaque push.

**En local** (il faut Android Studio, qui contient le SDK et Java) :
```powershell
npm run cap:android   # construit le web, synchronise, ouvre Android Studio
```
Puis *Build → Build APK(s)*.

**Version à publier** : il faut une clé de signature (keystore) à garder précieusement, puis `assembleRelease` signé (ou un AAB pour Google Play). Rien de cela n'est encore configuré.

## iOS
Apple impose un **Mac avec Xcode** et un compte **Apple Developer** (99 $/an) pour produire une app installable (TestFlight / App Store). Depuis Windows on ne peut pas la compiler.
- Le workflow « Build iOS » (manuel) compile le projet sur un Mac de GitHub, **sans signature**, pour vérifier qu'il compile. Il ne produit pas de `.ipa` installable.
- Sur un Mac : `npm run cap:ios`, puis signature et archive dans Xcode.

## Ce qui reste à faire pour une vraie publication
- **Icônes et écran de démarrage** : ceux de Capacitor par défaut sont en place ; fournir une icône 1024×1024 (outil `@capacitor/assets`).
- **Permissions** déjà déclarées : position, caméra, micro, vibration (Android) ; textes d'usage en français (iOS).
- **Serveurs** : `VITE_PAYMENT_API_URL` et `VITE_COACH_API_URL` doivent pointer vers des serveurs hébergés en HTTPS (pas `localhost`), à renseigner comme secrets GitHub pour le build.
- **Test sur vrais téléphones** : GPS en mouvement, caméra du Défi House, vibration, mode paysage de la carte.
- **Boutiques** : voir « Règles des boutiques » dans `docs/ABONNEMENT.md`.

## Compiler l'APK sur ton PC (sans GitHub)
Java 21 et l'Android SDK sont installés dans `C:\Users\DEK Creative Pro\dek-tools` (raccourci `C:\dektools`). Le projet est aussi accessible par `C:\dekapp` (chemin court, nécessaire pour Gradle).
```powershell
$env:JAVA_HOME = 'C:\dektools\jdk21'; $env:ANDROID_HOME = 'C:\dektools\android-sdk'; cd C:\dekapp; npm run cap:sync; cd android; .\gradlew.bat assembleDebug
```
L'APK sort dans `android\app\build\outputs\apk\debug\app-debug.apk`. La première compilation prend environ 12 minutes, les suivantes moins.
