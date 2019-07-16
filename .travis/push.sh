#!/bin/bash
setup_git() {
  git config --global user.email "travis@travis-ci.com"
  git config --global user.name "Travis CI"
}

commit_changes() {
  git checkout -b $TRAVIS_BRANCH
  git add .
  git commit -m "chore(automated): Travis Update drop data tables: ${date}"
}

upload_files() {
  git remote add origin-update https://${GITHUB_TOKEN}@github.com/${TRAVIS_REPO_SLUG}.git > /dev/null 2>&1
  git push --quiet --set-upstream  origin-update $TRAVIS_BRANCH
}

setup_git
commit_changes
upload_files
