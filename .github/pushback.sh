#!/bin/bash
setup_git() {
  git config --global user.email "translator@warframe.gg"
  git config --global user.name "Jimmy Bot"
}

commit_changes() {
  git remote add origin-update https://${GITHUB_TOKEN}@github.com/WFCD/warframe-drop-data.git > /dev/null 2>&1
  git checkout main
  git add data/.
  git commit -m "chore(automated): update drop data tables [ci skip]"
}

upload_files() {
  git push --quiet --set-upstream  origin-update main
}

setup_git
commit_changes
upload_files
