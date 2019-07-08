#!/bin/bash
setup_git() {
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis CI"
}

upload_files() {
  git add -am "chore(automated): Travis Update drop data tables: ${date}"
  git remote add origin-update https://${GITHUB_TOKEN}@github.com/WFCD/warframe-drop-data.git
  git push --quiet --set-upstream  origin-update $TRAVIS_BRANCH
}

setup_git
upload_files
