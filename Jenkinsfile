// Declarative Jenkins pipeline for the Vue reference app.
//
// What runs
//   Every build (push or pull request):
//       install, lint, format check, type-check, unit + integration + contract tests with the coverage
//       gate, production build.
//   Nightly (cron below, or tick RUN_NIGHTLY_SUITE for a manual run):
//       everything above, then API tests, browser tests (e2e + accessibility), visual tests, mutation tests.
//
// STATUS: written for this reference and NOT executed on a Jenkins server. Check the agent, plugin
// names and notification step against your installation before relying on it.
// Plugins used: Pipeline, Docker Pipeline, JUnit, Coverage (recordCoverage), HTML Publisher, Timestamper.
// If a published HTML report shows blank, Jenkins' Content-Security-Policy is blocking its scripts: ask your
// administrator for a narrow exception rather than disabling the policy.
//
// Visual tests compare screenshots with baselines that must be created in the same environment as CI.
// Run the build once with UPDATE_VISUAL_BASELINES ticked, download the PNGs from the build artifacts,
// review them, and commit them under tests/visual/__snapshots__/.

pipeline {
  agent {
    docker {
      // Node, Chromium and its system libraries. Keep this tag equal to the @playwright/test version
      // in package.json. --ipc=host stops Chromium running out of shared memory; --init reaps zombies.
      image 'mcr.microsoft.com/playwright:v1.56.1-noble'
      args '--ipc=host --init'
    }
    // No Docker on your agents? Use `agent { label 'node' }` instead and run
    // `npx playwright install --with-deps chromium` before the browser stages.
  }

  triggers {
    // Nightly at about 02:00 (H spreads the load). In a multibranch job only main gets the schedule.
    cron(env.BRANCH_NAME == null || env.BRANCH_NAME == 'main' ? 'H 2 * * *' : '')
  }

  parameters {
    booleanParam(name: 'RUN_NIGHTLY_SUITE', defaultValue: false,
      description: 'Run the nightly suite (API, browser, visual, mutation) now.')
    booleanParam(name: 'UPDATE_VISUAL_BASELINES', defaultValue: false,
      description: 'Regenerate the visual baselines and archive them. Download, review and commit them.')
  }

  options {
    timestamps()
    timeout(time: 90, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '30'))
    disableConcurrentBuilds()
  }

  environment {
    CI = 'true' // Playwright: forbidOnly, 2 retries, always start a fresh web server
    npm_config_cache = "${WORKSPACE}/.npm-cache"
  }

  stages {
    stage('Install') {
      steps {
        sh 'node --version && npm --version'
        // --ignore-scripts: dependencies' install hooks never run in CI. Browsers come with the Docker image.
        sh 'npm ci --ignore-scripts --no-audit --no-fund'
      }
    }

    stage('Static checks') {
      parallel {
        stage('Lint') {
          steps { sh 'npm run lint:ci' }
        }
        stage('Format') {
          steps { sh 'npm run format:check' }
        }
        stage('Types') {
          steps { sh 'npm run type-check' }
        }
      }
    }

    stage('Unit, component, integration and contract tests') {
      steps {
        // vitest run --coverage: fails when a test fails or coverage drops below the thresholds.
        sh 'npm test'
      }
      post {
        always {
          junit testResults: 'test-results/vitest-junit.xml', allowEmptyResults: false
          recordCoverage tools: [[parser: 'COBERTURA', pattern: 'coverage/cobertura-coverage.xml']]
          publishHTML target: [
            reportDir: 'coverage', reportFiles: 'index.html', reportName: 'Coverage',
            keepAll: true, alwaysLinkToLastBuild: true, allowMissing: true,
          ]
        }
      }
    }

    stage('Build') {
      steps { sh 'npm run build' }
      post {
        success { archiveArtifacts artifacts: 'dist/**', fingerprint: true }
      }
    }

    stage('Update visual baselines') {
      when { expression { return params.UPDATE_VISUAL_BASELINES } }
      steps {
        sh 'npm run test:visual:update'
        archiveArtifacts artifacts: 'tests/visual/__snapshots__/**/*.png', fingerprint: true
        echo 'Download the images from the build artifacts, review them, and commit them under tests/visual/__snapshots__/.'
      }
    }

    stage('Nightly suite') {
      when {
        anyOf {
          triggeredBy 'TimerTrigger'
          expression { return params.RUN_NIGHTLY_SUITE }
        }
      }
      // Each stage below marks the build UNSTABLE on failure and lets the next one run, so one
      // broken area never hides the results of the others.
      stages {
        stage('API tests') {
          environment {
            PLAYWRIGHT_JUNIT_OUTPUT_FILE = 'test-results/api-junit.xml'
            PLAYWRIGHT_HTML_OUTPUT_DIR = 'playwright-report/api'
          }
          steps {
            catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
              sh 'npm run test:api -- --output=test-results/api'
            }
          }
          post {
            always {
              junit testResults: 'test-results/api-junit.xml', allowEmptyResults: true
              publishHTML target: [
                reportDir: 'playwright-report/api', reportFiles: 'index.html', reportName: 'Playwright API report',
                keepAll: true, alwaysLinkToLastBuild: true, allowMissing: true,
              ]
            }
          }
        }

        stage('Browser tests (e2e and accessibility)') {
          environment {
            PLAYWRIGHT_JUNIT_OUTPUT_FILE = 'test-results/e2e-junit.xml'
            PLAYWRIGHT_HTML_OUTPUT_DIR = 'playwright-report/e2e'
          }
          steps {
            catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
              sh 'npm run test:e2e -- --output=test-results/e2e'
            }
          }
          post {
            always {
              junit testResults: 'test-results/e2e-junit.xml', allowEmptyResults: true
              publishHTML target: [
                reportDir: 'playwright-report/e2e', reportFiles: 'index.html', reportName: 'Playwright browser report',
                keepAll: true, alwaysLinkToLastBuild: true, allowMissing: true,
              ]
            }
          }
        }

        stage('Visual tests') {
          environment {
            PLAYWRIGHT_JUNIT_OUTPUT_FILE = 'test-results/visual-junit.xml'
            PLAYWRIGHT_HTML_OUTPUT_DIR = 'playwright-report/visual'
          }
          steps {
            catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
              sh 'npm run test:visual -- --output=test-results/visual'
            }
          }
          post {
            always {
              junit testResults: 'test-results/visual-junit.xml', allowEmptyResults: true
              publishHTML target: [
                reportDir: 'playwright-report/visual', reportFiles: 'index.html', reportName: 'Playwright visual report',
                keepAll: true, alwaysLinkToLastBuild: true, allowMissing: true,
              ]
            }
          }
        }

        stage('Mutation tests') {
          steps {
            catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
              // The clear-text table in the console log shows the score and surviving mutants.
              sh 'npm run test:mutate'
            }
          }
          post {
            always {
              archiveArtifacts artifacts: 'reports/mutation/**', allowEmptyArchive: true
              publishHTML target: [
                reportDir: 'reports/mutation', reportFiles: 'index.html', reportName: 'Mutation report',
                keepAll: true, alwaysLinkToLastBuild: true, allowMissing: true,
              ]
            }
          }
        }
      }
    }
  }

  post {
    always {
      // Everything needed to investigate a failure offline: HTML reports, traces, and the
      // expected/actual/diff images of failed visual tests. Open with `npx playwright show-report <folder>`.
      archiveArtifacts artifacts: 'playwright-report/**, test-results/**', allowEmptyArchive: true
    }
    unsuccessful {
      echo "Build ${env.BUILD_NUMBER} finished as ${currentBuild.currentResult}: ${env.BUILD_URL}"
      // Notify the team, for example:
      // mail to: 'team@example.com', subject: "${env.JOB_NAME} #${env.BUILD_NUMBER}: ${currentBuild.currentResult}", body: env.BUILD_URL
    }
  }
}
