const { getGitHubIssues } = require('./src/lib/github');

async function test() {
  console.log('Testing GitHub Issue Fetch...');
  const issues = await getGitHubIssues();
  console.log('Issues found:', issues.length);
  if (issues.length > 0) {
    console.log('First issue title:', issues[0].title);
  } else {
    console.log('No issues returned. Check console for errors.');
  }
}

test();
