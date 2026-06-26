import fs from "fs";
import fetch from "node-fetch";

async function main() {
  const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
  console.log("Connecting to project:", config.projectId);
  
  // Sign in anonymously
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.apiKey}`;
  const signUpRes = await fetch(signUpUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true })
  });
  if (!signUpRes.ok) {
    console.error("Auth failed:", await signUpRes.text());
    return;
  }
  const { idToken } = await signUpRes.json();
  console.log("Authenticated successfully.");

  // Fetch posts
  const databaseId = config.firestoreDatabaseId || "(default)";
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${databaseId}/documents/posts?pageSize=300`;
  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${idToken}` }
  });
  
  if (!res.ok) {
    console.error("Failed to fetch posts:", await res.text());
    return;
  }
  const data = await res.json();
  const docs = data.documents || [];
  console.log(`Found ${docs.length} posts in Firestore.`);
  for (const doc of docs) {
    const fields = doc.fields || {};
    const id = doc.name.split("/").pop();
    const content = fields.content?.stringValue || "";
    const userId = fields.userId?.stringValue || "";
    const userName = fields.userName?.stringValue || "";
    console.log(`- Post [${id}] by [${userName} (${userId})]: "${content.substring(0, 80)}"`);
  }
}

main().catch(console.error);
