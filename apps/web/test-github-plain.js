const OWNER = "vuongtrann" 
const REPO = "quizforge"

async function testGitHub() {
  console.log(`[Test] Fetching issues for ${OWNER}/${REPO}...`)
  
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues?state=all&per_page=30`, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "QuizForge-App-Test"
      }
    });
    
    console.log(`[Test] Response Status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
       const text = await res.text();
       console.log(`[Test] Error Body: ${text}`);
       return;
    }

    const data = await res.json();
    const issues = data.filter(item => !item.pull_request);
    console.log(`[Test] Issues found: ${issues.length}`);
    if (issues.length > 0) {
      console.log(`[Test] Sample: #${issues[0].number} - ${issues[0].title}`);
    }
  } catch (err) {
    console.error("[Test] Fetch error:", err);
  }
}

testGitHub();
