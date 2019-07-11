#!/bin/bash
setup_git() {
  git config --global user.email "travis@travis-ci.com"
  git config --global user.name "Travis CI"
}

upload_files() {
  git add . && git commit -m "chore(automated): Travis Update drop data tables: ${date}"
  git remote add origin-update https://tobitenno:${GITHUB_TOKEN}@github.com/WFCD/warframe-drop-data.git > /dev/null 2>&1
  git push --quiet --set-upstream  origin-update $TRAVIS_BRANCH
}

setup_git
upload_files
