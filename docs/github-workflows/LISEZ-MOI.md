# Workflows GitHub (à activer)

`build-android.yml` compile l'APK sur GitHub, `build-ios.yml` vérifie la compilation iOS.
GitHub refuse de les recevoir tant que le jeton de connexion n'a pas le droit « workflow ».

Pour les activer, au choix :
1. `gh auth refresh -h github.com -s workflow` (valider le code sur github.com/login/device), puis copier les deux
   fichiers dans `.github/workflows/` et pousser ;
2. ou, sur github.com, *Add file → Create new file* nommé `.github/workflows/build-android.yml`, y coller le contenu.
