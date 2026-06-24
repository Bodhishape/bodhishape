import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { AsyncLocalStorage } from "async_hooks";
import { 
  getFirestore, doc, getDoc, setDoc, getDocs, collection, 
  deleteDoc, query, where, orderBy, limit, initializeFirestore,
  setLogLevel
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { hasRole } from "./src/lib/roles";
import { createRemoteJWKSet, jwtVerify } from "jose";

dotenv.config();
setLogLevel("silent");

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data", "database.json");
const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><rect width='128' height='128' fill='%231e293b'/><circle cx='64' cy='48' r='24' fill='%236366f1'/><path d='M28,104 C28,80 44,72 64,72 C84,72 100,80 100,104' fill='%236366f1'/></svg>";

// Ensure data folder exists
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
}

// 1. Initial local seeding fallback definitions
const initialData = {
  users: [],
  activities: [],
  posts: [],
  goals: [],
  communities: [],
  kofu: [],
  bs_subscription: [],
  chats: [],
  stories: [],
  reminders: [],
  notices: [],
  memories: [],
  system_config: {
    trialStartDate: new Date().toISOString()
  }
};

// 2. Initialize Firebase Client matching config properties
let db: any = null;
let firebaseConfig: any = null;
const requestContext = new AsyncLocalStorage<any>();

// Remote JWKS Setup for manual Firebase Token validation using jose
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

async function verifyFirebaseToken(idToken: string, projectId: string) {
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return payload; // { sub: uid, email: email, ... }
  } catch (err: any) {
    console.error("[AUTH] JWKS JWT Token verification failed:", err.message);
    return null;
  }
}

function toFirestoreValue(val: any): any {
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === "boolean") return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue).filter((v: any) => v !== null) } };
  }
  if (val && typeof val === "object") {
    const fields: any = {};
    for (const k of Object.keys(val)) {
      const fVal = toFirestoreValue(val[k]);
      if (fVal !== null) {
        fields[k] = fVal;
      }
    }
    return { mapValue: { fields } };
  }
  return null;
}

// 2.2 SMTP Welcome Email System
const interceptedEmails: any[] = [];

async function sendConfirmationEmail(user: any) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "BodhiShape <no-reply@bodhishape.com>";

  const emailSubject = "🪷 Bem-vindo ao BodhiShape! Sua conta foi ativada com sucesso! 💪✨";

  const emailHtml = `
    <div style="font-family: 'Inter', system-ui, sans-serif; background-color: #070114; color: #f1f5f9; padding: 40px 20px; text-align: center; max-width: 600px; margin: 0 auto; border-radius: 24px; border: 1px solid rgba(235, 34, 141, 0.25);">
      <div style="margin-bottom: 24px;">
        <img src="https://ai.studio/build/bodhishape_logo_1781108377890.png" alt="BodhiShape Logo" style="width: 100px; height: 100px; border-radius: 50%; border: 2px solid #eb228d;" />
      </div>
      <h1 style="font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 8px; text-transform: uppercase;">Olá, ${user.displayName || user.name}!</h1>
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; max-width: 460px; margin: 0 auto 24px auto;">
        Parabéns por dar o primeiro passo rumo à sua transformação diária! Sua conta do <strong>BodhiShape</strong> está ativa, estável e integrada em nuvem.
      </p>
      
      <div style="background-color: #0d0526; border: 1px solid rgba(124, 58, 237, 0.25); border-radius: 16px; padding: 18px; margin-bottom: 24px; text-align: left;">
        <h3 style="font-size: 11px; font-weight: 900; color: #39df1d; text-transform: uppercase; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid rgba(124, 58, 237, 0.15); padding-bottom: 6px;">📋 DADOS DA SUA CONTA</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
          <tr>
            <td style="padding: 4px 0; color: #a1a1aa;">Nome de Guerra:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #f8fafc;">${user.name}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #a1a1aa;">E-mail:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #f8fafc;">${user.email}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #a1a1aa;">Divisão:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #f8fafc;">${user.division === 'JS' ? 'Juventude Soka' : user.division === 'DF' ? 'Divisão Feminina' : 'Divisão Sênior'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #a1a1aa;">Região/RM:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #f8fafc;">${user.region}</td>
          </tr>
        </table>
      </div>

      <div style="font-style: italic; color: #d946ef; font-size: 13px; font-weight: bold; margin-bottom: 24px;">
        "Suando o Karma, Conquistando Vitórias Diárias!"
      </div>

      <div style="border-top: 1px solid #1e1b4b; padding-top: 16px; font-size: 10px; color: #71717a; line-height: 1.5;">
        Para acessar seu perfil em qualquer dispositivo ou navegador, basta digitar seu e-mail cadastrado na aba <strong>Acessar Conta</strong>. Seus dados estão persistidos com segurança eterna no Firebase.
      </div>
    </div>
  `;

  const emailText = `Olá, ${user.displayName || user.name}!\n\nParabéns por criar sua conta no BodhiShape! Seus dados cadastrados foram salvos com sucesso e integrados ao Firebase.\n\nE-mail de acesso: ${user.email}\nDivisão: ${user.division}\nRegião: ${user.region}\n\n"Suando o Karma, Conquistando Vitórias Diárias!"\n\nAbraço,\nEquipe BodhiShape`;

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: user.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });

      console.log(`[EMAIL SYSTEM] Welcome email successfully sent via SMTP to ${user.email}`);
      return { sent: true, method: "SMTP" };
    } catch (err: any) {
      console.warn("[EMAIL SYSTEM] Error sending real email via SMTP, logging instead:", err.message);
    }
  }

  // Log to in-memory intercepted list for the frontend debug sandbox
  interceptedEmails.push({
    id: "mail-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
    to: user.email,
    subject: emailSubject,
    text: emailText,
    html: emailHtml,
    timestamp: new Date().toISOString()
  });
  if (interceptedEmails.length > 50) {
    interceptedEmails.shift();
  }

  // Graceful fallback logger
  console.log("\n==================================================================================");
  console.log(`[EMAIL PREVIEW LOGGER] WELCOME EMAIL SENT TO ${user.email}`);
  console.log("Subject:", emailSubject);
  console.log("----------------------------------------------------------------------------------");
  console.log(emailText);
  console.log("==================================================================================\n");
  return { sent: true, method: "CONSOLE_PREVIEW", template: emailHtml };
}

// 3. Write-Through Local Cache with persistent safety limits
let dbData: any = {
  users: [],
  activities: [],
  posts: [],
  goals: [],
  communities: [],
  kofu: [],
  bs_subscription: [],
  chats: [],
  stories: [],
  reminders: [],
  feedbacks: [],
  lives: [],
  live_comments: [],
  system_config: { trialStartDate: new Date().toISOString() }
};

// Seeding and synchronizing memory state on boot
async function seedAndLoadFromFirestore() {
  // Load local file database.json as backup and seeding reference
  let localDbSeed: any = initialData;
  if (fs.existsSync(DB_FILE)) {
    try {
      localDbSeed = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    } catch (e) {
      localDbSeed = initialData;
    }
  }

  // Initialize in-memory cache with local records
  dbData = localDbSeed;
  if (!dbData.feedbacks) dbData.feedbacks = [];
  if (!dbData.lives) dbData.lives = [];
  if (!dbData.live_comments) dbData.live_comments = [];
  console.log("[FIREBASE] Initialized database state smoothly from local JSON cache.");
  return;
}

// Deserializador de valores do Firestore REST API
function fromFirestoreValue(val: any): any {
  if (!val) return null;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return parseInt(val.integerValue, 10);
  if ("doubleValue" in val) return parseFloat(val.doubleValue);
  if ("booleanValue" in val) return val.booleanValue;
  if ("arrayValue" in val) {
    const values = val.arrayValue.values || [];
    return values.map(fromFirestoreValue);
  }
  if ("mapValue" in val) {
    const fields = val.mapValue.fields || {};
    const res: any = {};
    for (const k of Object.keys(fields)) {
      res[k] = fromFirestoreValue(fields[k]);
    }
    return res;
  }
  return null;
}

// Parser de documentos retornados pelo Firestore REST API
function parseFirestoreDoc(doc: any): any {
  if (!doc || !doc.fields) return null;
  const res: any = {};
  if (doc.name) {
    const parts = doc.name.split("/");
    res.id = parts[parts.length - 1];
  }
  for (const k of Object.keys(doc.fields)) {
    res[k] = fromFirestoreValue(doc.fields[k]);
  }
  return res;
}

// Sincroniza dados específicos do usuário de forma real e reativa a partir do Firestore em nuvem
async function syncUserFromFirestore(userId: string, idToken: string) {
  if (!firebaseConfig || !idToken || !userId) return;

  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const headers = {
    "Authorization": `Bearer ${idToken}`,
    "Content-Type": "application/json"
  };

  try {
    // 1. Obter Perfil do Usuário
    const userRes = await fetch(`${baseUrl}/users/${userId}`, { headers });
    if (userRes.ok) {
      const userDoc = await userRes.json();
      const parsedUser = parseFirestoreDoc(userDoc);
      if (parsedUser) {
        const index = dbData.users.findIndex((u: any) => u.id === userId);
        if (index !== -1) {
          dbData.users[index] = { ...dbData.users[index], ...parsedUser };
        } else {
          dbData.users.push(parsedUser);
        }
      }
    }

    // Helper genérico para buscar dados de uma subcoleção por userId
    const queryCollection = async (collectionId: string) => {
      const queryBody = {
        structuredQuery: {
          from: [{ collectionId }],
          where: {
            fieldFilter: {
              field: { fieldPath: "userId" },
              op: "EQUAL",
              value: { stringValue: userId }
            }
          }
        }
      };

      const qRes = await fetch(`${baseUrl}:runQuery`, {
        method: "POST",
        headers,
        body: JSON.stringify(queryBody)
      });

      if (qRes.ok) {
        const results = await qRes.json();
        const docs: any[] = [];
        if (Array.isArray(results)) {
          for (const item of results) {
            if (item.document) {
              const parsed = parseFirestoreDoc(item.document);
              if (parsed) docs.push(parsed);
            }
          }
        }
        return docs;
      }
      return null;
    };

    // 2. Buscar Atividades históricas do usuário
    const activities = await queryCollection("activities");
    if (activities) {
      dbData.activities = dbData.activities.filter((a: any) => a.userId !== userId);
      dbData.activities.push(...activities);
    }

    // 3. Buscar Objetivos do usuário
    const goals = await queryCollection("goals");
    if (goals) {
      dbData.goals = dbData.goals.filter((g: any) => g.userId !== userId);
      dbData.goals.push(...goals);
    }

    // 4. Buscar Inscrição BS do usuário
    const bsRes = await fetch(`${baseUrl}/bs_subscription/${userId}`, { headers });
    if (bsRes.ok) {
      const bsDoc = await bsRes.json();
      const parsedBs = parseFirestoreDoc(bsDoc);
      if (parsedBs) {
        const index = dbData.bs_subscription.findIndex((b: any) => b.userId === userId);
        if (index !== -1) {
          dbData.bs_subscription[index] = parsedBs;
        } else {
          dbData.bs_subscription.push(parsedBs);
        }
      }
    }

    // 5. Buscar Contribuição Kofu do usuário
    const kofuRes = await fetch(`${baseUrl}/kofu/${userId}_campanha_3_2026`, { headers });
    if (kofuRes.ok) {
      const kofuDoc = await kofuRes.json();
      const parsedKofu = parseFirestoreDoc(kofuDoc);
      if (parsedKofu) {
        const index = dbData.kofu.findIndex((k: any) => k.userId === userId && k.campaignId === "campanha_3_2026");
        if (index !== -1) {
          dbData.kofu[index] = parsedKofu;
        } else {
          dbData.kofu.push(parsedKofu);
        }
      }
    }

    // 6. Buscar Lembretes/Agenda do usuário
    const reminders = await queryCollection("reminders");
    if (reminders) {
      if (!dbData.reminders) dbData.reminders = [];
      dbData.reminders = dbData.reminders.filter((r: any) => r.userId !== userId);
      dbData.reminders.push(...reminders);
    }

    // Grava de volta no banco de dados local como backup de redundância
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf8");
    } catch (e) {
      // falha silenciosa de escrita local não impede o funcionamento
    }

  } catch (error: any) {
    console.error(`[FIREBASE_SYNC] Erro de sincronização em tempo real do Firestore:`, error.message);
  }
}

// Persist document changes
async function persistDoc(colName: string, docId: string, data: any, idToken?: string, options?: { isUpdate?: boolean }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf8");
  } catch (e) {
    // local failure
  }
  if (!firebaseConfig) return;
  if (!idToken) {
    console.warn(`[FIREBASE] Skipped Firestore write for ${colName}/${docId} because no ID Token is available.`);
    return;
  }

  const isUpdate = options?.isUpdate ?? false;

  const fields: any = {};
  for (const k of Object.keys(data)) {
    if (k === "id") continue;
    const val = data[k];
    if (val !== undefined && val !== null) {
      const fVal = toFirestoreValue(val);
      if (fVal !== null) {
        fields[k] = fVal;
      }
    }
  }

  const fieldPaths = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join("&");
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${colName}/${docId}${fieldPaths ? `?${fieldPaths}` : ""}`;
  
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ fields })
    });
    if (!res.ok) {
      const errText = await res.text();
      
      // If we are performing an update, we MUST NOT perform a fallback write without updateMask.
      // Doing so would replace the entire document in Firestore and completely wipe out any other fields.
      if (isUpdate) {
        console.error(`[FIREBASE_REST] Update failed on ${colName}/${docId} using updateMask:`, errText);
        return;
      }

      console.warn(`[FIREBASE_REST] Write patch with updateMask failed on ${colName}/${docId}, retrying without updateMask to force document creation...`);
      const fallbackUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${colName}/${docId}`;
      const retryRes = await fetch(fallbackUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ fields })
      });
      if (!retryRes.ok) {
        const retryErrText = await retryRes.text();
        console.error(`[FIREBASE_REST] Write retry failed on ${colName}/${docId}:`, retryErrText);
      } else {
        console.log(`[FIREBASE_REST] Successfully created document ${colName}/${docId} on retry.`);
      }
    }
  } catch (error: any) {
    console.error(`[FIREBASE_REST] Write exception on ${colName}/${docId}:`, error.message);
  }
}

// Remove document changes
async function removeDoc(colName: string, docId: string, idToken?: string) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf8");
  } catch (e) {
    // local failure
  }
  if (!firebaseConfig) return;
  if (!idToken) {
    console.warn(`[FIREBASE] Skipped Firestore delete for ${colName}/${docId} because no ID Token is available.`);
    return;
  }

  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${colName}/${docId}`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${idToken}`
      }
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[FIREBASE_REST] Delete failed on ${colName}/${docId}:`, errText);
    }
  } catch (error: any) {
    console.error(`[FIREBASE_REST] Delete exception on ${colName}/${docId}:`, error.message);
  }
}

// Helper to read database (Returns a deep clone so mutations do not leak)
function readDB() {
  if (dbData && dbData.users) {
    dbData.users.forEach((u: any) => {
      u.daimokuBalance = u.daimokuBalance !== undefined ? u.daimokuBalance : 0;
    });
  }
  // Return a deep clone so that routes mutate isolated objects
  return JSON.parse(JSON.stringify(dbData));
}

// Helper to write database (Stores data and propagates precise diffs to Firestore)
function writeDB(data: any, idToken?: string) {
  const context = requestContext.getStore() as any;
  const activeToken = idToken || context?.idToken;

  // Keep the previous global database content for diff comparisons
  const previousData = dbData;
  
  // Save the new state into global memory via a deep clone
  dbData = JSON.parse(JSON.stringify(data));
  
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf8");
  } catch (error) {
    console.error("Local JSON write-back issue:", error);
  }

  // propagate change differences to Firebase Firestore asynchronously
  if (!firebaseConfig) return;

  const collections = ["users", "activities", "posts", "goals", "communities", "kofu", "bs_subscription", "chats", "stories", "persistent_media", "memories", "notices", "lives", "live_comments", "feedbacks"];
  
  for (const col of collections) {
    const prevList = previousData[col] || [];
    const newList = dbData[col] || [];
    
    // Find created or modified records
    for (const newItem of newList) {
      let docId = newItem.id;
      if (!docId) {
        if (col === "kofu") docId = `${newItem.userId}_${newItem.campaignId}`;
        else if (col === "bs_subscription") docId = newItem.userId;
      }
      
      if (!docId) continue;
      
      const prevItem = prevList.find((p: any) => {
        let pId = p.id;
        if (!pId) {
          if (col === "kofu") pId = `${p.userId}_${p.campaignId}`;
          else if (col === "bs_subscription") pId = p.userId;
        }
        return pId === docId;
      });
      
      if (!prevItem) {
        // Document was created - persist all fields safely
        persistDoc(col, docId, newItem, activeToken, { isUpdate: false });
      } else if (JSON.stringify(prevItem) !== JSON.stringify(newItem)) {
        // Document was modified - calculate the delta of changed fields
        const delta: any = {};
        for (const k of Object.keys(newItem)) {
          if (JSON.stringify(prevItem[k]) !== JSON.stringify(newItem[k])) {
            delta[k] = newItem[k];
          }
        }
        if (Object.keys(delta).length > 0) {
          persistDoc(col, docId, delta, activeToken, { isUpdate: true });
        }
      }
    }
    
    // Find deleted records
    for (const prevItem of prevList) {
      let docId = prevItem.id;
      if (!docId) {
        if (col === "kofu") docId = `${prevItem.userId}_${prevItem.campaignId}`;
        else if (col === "bs_subscription") docId = prevItem.userId;
      }
      
      if (!docId) continue;
      
      const existsInNew = newList.some((n: any) => {
        let nId = n.id;
        if (!nId) {
          if (col === "kofu") nId = `${n.userId}_${n.campaignId}`;
          else if (col === "bs_subscription") nId = n.userId;
        }
        return nId === docId;
      });
      
      if (!existsInNew) {
        removeDoc(col, docId, activeToken);
      }
    }
  }
}

// Helper to reliably update and calculate user active streaks from history of activities and logs
function updateAndCalculateUserStreak(user: any, dbData: any, logTimestamp?: string) {
  if (!user) return;

  const userActs = (dbData.activities || []).filter((a: any) => a.userId === user.id);
  
  const getLocalSaoPauloDateString = (dateInput?: string | number | Date) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  };

  const datesSet = new Set<string>();
  
  userActs.forEach((a: any) => {
    const dateStr = getLocalSaoPauloDateString(a.timestamp || a.date);
    if (dateStr) {
      datesSet.add(dateStr);
    }
  });

  if (logTimestamp) {
    const dateStr = getLocalSaoPauloDateString(logTimestamp);
    if (dateStr) {
      datesSet.add(dateStr);
    }
  }

  const uniqueDays = Array.from(datesSet).filter(Boolean) as string[];
  if (uniqueDays.length === 0) {
    user.streak = 0;
    return;
  }

  uniqueDays.sort((a, b) => b.localeCompare(a)); // sort descending (most recent first)

  // Get current date string in Sao Paulo timezone
  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  
  // Calculate yesterdayStr in America/Sao_Paulo in a timezone-safe way
  const todayParts = todayStr.split("-").map(Number);
  const todaySP = new Date(todayParts[0], todayParts[1] - 1, todayParts[2], 12, 0, 0); // Noon in local server time to avoid DST shifts
  const yesterdaySP = new Date(todaySP.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = `${yesterdaySP.getFullYear()}-${(yesterdaySP.getMonth() + 1).toString().padStart(2, "0")}-${yesterdaySP.getDate().toString().padStart(2, "0")}`;

  // If the most recent active day is not today and not yesterday, sequence is broken
  if (uniqueDays[0] !== todayStr && uniqueDays[0] !== yesterdayStr) {
    user.streak = 0;
    return;
  }

  // Calculate consecutive days
  let calculatedStreak = 1;
  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const currentDay = new Date(uniqueDays[i] + "T00:00:00Z");
    const nextDay = new Date(uniqueDays[i + 1] + "T00:00:00Z");
    
    const diffTime = currentDay.getTime() - nextDay.getTime();
    const actualDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (actualDiff === 1) {
      calculatedStreak++;
    } else if (actualDiff > 1) {
      break; // Streak broken
    }
  }

  user.streak = calculatedStreak;
}

app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// --- MIDDLEWARES & HELPERS DE SEGURANÇA E AUDITORIA MÁXIMA ---

// 1. Sanitizador de Entrada contra XSS (Cross-Site Scripting)
function sanitizeInput(str: string): string {
  if (typeof str !== "string") return "";
  // Escapa caracteres HTML perigosos para inativar tags e injeções de script
  let clean = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  // Remove caminhos javascript: ou dados inline potencialmente maliciosos
  clean = clean.replace(/javascript\s*:/gi, "no-js:");
  clean = clean.replace(/data\s*:\s*text\/html/gi, "no-data:");
  return clean;
}

// 2. Bloqueador de Malware, Injeção, Scripts e Links Suspeitos
function hasMalwareOrSuspiciousPatterns(text: string): boolean {
  if (typeof text !== "string") return false;
  
  // NEVER perform string-based regex scanners on raw base64 data payloads (starts with "data:"),
  // because random combinations of bytes will statistically trigger false positives on words like "eval", "onload" etc.
  if (text.startsWith("data:")) return false;

  // Procura por extensões executáveis perigosas, manipuladores de eventos inline e termos de injeção
  const dangerousPatterns = [
    /\.(exe|bat|sh|cmd|com|msi|vbs|js|scr|php|phtml|py|pl|reg|lnk|apk|jar)\b/i, // Arquivos executáveis/scripts
    /<script/i, // Scripts explícitos
    /onload\s*=/i, // Atributos inline maliciosos
    /onerror\s*=/i,
    /onclick\s*=/i,
    /eval\s*\(/i, // Execução dinâmica
    /javascript\s*:/i, // Protocolo JS
    /document\.(cookie|write)/i, // Acesso a cookies/documento
    /window\.(location|alert)/i,
    /union\s+select/i, // Ataques de injeção
    /drop\s+table/i
  ];
  return dangerousPatterns.some(pattern => pattern.test(text));
}

// 3. Validador e Bloqueador de Imagens Maliciosas / Extensões Suspeitas
function isValidImageURL(url: string | undefined | null): boolean {
  if (!url) return true; // URLs vazias/opcionais são permitidas
  if (typeof url !== "string") return false;

  // Se for dados de imagem ou vídeo codificados em base64, ignoramos os checks de URL externa normais
  if (url.startsWith("data:")) {
    // Permitir tipos gráficos comuns e vídeo / streams em geral (incluindo heic, octet-stream para fotos Apple, mp4)
    const isBase64Valid = /^data:(image|video|application)\/(jpeg|jpg|png|webp|gif|svg\+xml|heic|heif|mp4|mov|quicktime|octet-stream);base64,/i.test(url) || url.startsWith("data:");
    if (!isBase64Valid) {
      console.warn("[SECURITY WARN] Formato de string base64 de mídia inválido.");
      return false;
    }
    if (url.length > 150 * 1024 * 1024) { // Aceitar até 150MB para suportar vídeos curtos reais da câmera
      console.warn("[SECURITY WARN] Mídia base64 excede o limite estrito do servidor de 150MB.");
      return false;
    }
    return true; // É um stream de mídia base64 válido e seguro
  }

  // Permite links locais (como /uploads/...)
  if (url.startsWith("/")) {
    return true;
  }

  // Proteção de tamanho para URLs normais para evitar injeções massivas (DoS / Denial of Wallet)
  if (url.length > 5000) {
    console.warn("[SECURITY WARN] URL de imagem excede o tamanho permitido.");
    return false;
  }

  // Exige protocolo http ou https para links externos
  if (!/^https?:\/\//i.test(url)) {
    return false;
  }

  // Verifica se o link em si possui padrões maliciosos
  if (hasMalwareOrSuspiciousPatterns(url)) {
    return false;
  }

  const lowerUrl = url.toLowerCase();

  // Bloqueia categoricamente extensões de arquivo executáveis na URL
  const blacklistRegex = /\.(exe|bat|cmd|sh|msi|vbs|js|scr|php|py|zip|tar|gz|apk|rar|bin)\b/i;
  if (blacklistRegex.test(lowerUrl)) {
    return false;
  }

  // Permite apenas formatos gráficos/mídia comuns consolidados ou cDNAs confiáveis
  const hasImageExtension = /\.(jpeg|jpg|png|webp|gif|svg|bmp|heic|heif|mp4|mov|webm|avi)(\?.*)?$/i.test(lowerUrl) ||
                            lowerUrl.includes("images.unsplash.com") ||
                            lowerUrl.includes("api.dicebear.com") ||
                            lowerUrl.includes("uploads") ||
                            lowerUrl.includes("image") ||
                            lowerUrl.includes("video");

  return hasImageExtension;
}

// 4. Rate Limiter robusto em memória contra Flood / Spam / Abuso automatizado
const rateLimits: Record<string, { count: number; resetTime: number }> = {};

function rateLimiter(req: any, res: any, next: any) {
  // Executa limite estritamente para endpoints da API
  if (!req.url.startsWith("/api/")) {
    return next();
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
  const key = req.body?.userId ? `${req.body.userId}_${ip}` : ip;
  const now = Date.now();
  const limitWindowMs = 60 * 1000; // Janela de 1 minuto
  const maxRequests = 60; // Máximo de 60 requisições de gravação/leitura de API por minuto por cliente/usuário

  if (!rateLimits[key]) {
    rateLimits[key] = { count: 1, resetTime: now + limitWindowMs };
    return next();
  }

  const limit = rateLimits[key];
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + limitWindowMs;
    return next();
  }

  limit.count++;
  if (limit.count > maxRequests) {
    console.warn(`[SECURITY ALERT - RATE LIMIT EXCEEDED] Abuso automatizado / Flood detectado da chave: ${key}`);
    return res.status(429).json({
      error: "Muitas requisições sequenciais. Para manter a segurança da comunidade, por favor aguarde 1 minuto."
    });
  }

  next();
}

app.use(rateLimiter);

app.use((req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  let idToken = undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    idToken = authHeader.substring(7);
    req.idToken = idToken;
  }
  requestContext.run({ idToken }, () => {
    next();
  });
});

const lastSyncTime = new Map<string, number>();

app.use("/api", async (req: any, res: any, next: any) => {
  const idToken = req.idToken;
  if (idToken && firebaseConfig) {
    try {
      const payload = await verifyFirebaseToken(idToken, firebaseConfig.projectId);
      if (payload && payload.sub) {
        const userId = payload.sub;
        const now = Date.now();
        const lastSync = lastSyncTime.get(userId) || 0;
        // If never synced in this container lifetime, or synced more than 30 seconds ago
        if (now - lastSync > 30000) {
          lastSyncTime.set(userId, now); // Set it early to prevent concurrent overlapping fetches
          await syncUserFromFirestore(userId, idToken);
        }
      }
    } catch (err: any) {
      console.error("[AUTO_SYNC] Error in automatic Firestore sync middleware:", err.message);
    }
  }
  next();
});

app.get("/api/firebase-config", (req, res) => {
  if (firebaseConfig) {
    res.json({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    });
  } else {
    res.status(404).json({ error: "Firebase configuration not loaded on server." });
  }
});

app.get("/api/debug/intercepted-emails", async (req: any, res) => {
  // 1. Unconditional production block
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Access to debug resources is strictly forbidden in production mode." });
  }

  // 2. Defense-in-depth: Require a valid Firebase token with admin/developer role
  // even in non-production environments to prevent unauthorized remote access.
  const idToken = req.idToken;
  if (!idToken) {
    return res.status(401).json({ error: "Authentication token is required to access debug resources." });
  }

  try {
    const payload = await verifyFirebaseToken(idToken, firebaseConfig.projectId);
    if (!payload || !payload.email) {
      return res.status(401).json({ error: "Invalid authentication token." });
    }

    const email = String(payload.email).toLowerCase();

    // Lookup user database profile role for strict DB RBAC check
    const dbData = readDB();
    const matchedUser = dbData.users.find((u: any) => u.email && u.email.toLowerCase() === email);
    const hasAdminRole = matchedUser && hasRole(matchedUser, ["admin", "developer"]);

    if (!hasAdminRole) {
      return res.status(403).json({ error: "Forbidden: You do not have the required role to access debug resources." });
    }

    res.json(interceptedEmails);
  } catch (err: any) {
    console.error("[DEBUG AUTH] Error checking debug permissions:", err);
    res.status(500).json({ error: "Internal server error during authorization check." });
  }
});

// Get list of users with stats computed (email stripped for public, kept only for matching requested authenticated user)
app.get("/api/users", (req: any, res) => {
  const dbData = readDB();
  const requesterId = req.query.userId || req.headers["x-user-id"];
  const queryEmail = req.query.email ? String(req.query.email).trim().toLowerCase() : null;
  
  // Recalcular streaks dinamicamente para manter o painel de desenvolvimento e leaderboard 100% atualizados
  let hasChanges = false;
  dbData.users.forEach((u: any) => {
    const oldStreak = u.streak || 0;
    updateAndCalculateUserStreak(u, dbData);
    if ((u.streak || 0) !== oldStreak) {
      hasChanges = true;
    }
  });
  if (hasChanges) {
    writeDB(dbData, req.idToken);
  }
  
  if (queryEmail) {
    // Retorna apenas se o e-mail correspondente existir, e mantém o e-mail no retorno para as verificações de existência do frontend.
    const matched = (dbData.users || []).filter((u: any) => u.email && u.email.toLowerCase() === queryEmail);
    return res.json(matched);
  }

  const publicUsers = (dbData.users || []).map((u: any) => {
    if (requesterId && u.id === requesterId) {
      return u;
    }
    const { email, ...rest } = u;
    return rest;
  });
  
  res.json(publicUsers);
});

// Auth / Login-Register route (Simplificado/Sem Senhas)
app.post("/api/auth/login-register", async (req: any, res) => {
  const { 
    id: bodyId,
    email, 
    displayName, 
    avatar, 
    city, 
    division, 
    organization, 
    district, 
    region, 
    subDistrict, 
    horizontalGroup, 
    localGroup, 
    horizontalGroupOfficial 
  } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "E-mail é obrigatório." });
  }

  // Validação estrita do padrão de E-mail, mitigando injeção ou excesso de tamanho
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Formato de E-mail inválido ou tamanho excedido." });
  }

  if (avatar && !isValidImageURL(avatar)) {
    return res.status(400).json({ error: "Foto de perfil suspeita bloqueada por segurança." });
  }

  // Support UIDs from Firebase Auth Token if available
  let id = bodyId || "user-" + Math.random().toString(36).substr(2, 9);
  if (req.idToken && firebaseConfig) {
    const payload = await verifyFirebaseToken(req.idToken, firebaseConfig.projectId);
    if (payload) {
      id = payload.sub as string;
    }
  }

  const dbData = readDB();
  let user = dbData.users.find((u: any) => u.id === id || u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Novo usuário: Autocadastro sem atrito e sem senhas
    const safeDisplayName = sanitizeInput(displayName || email.split("@")[0]);
    const safeName = safeDisplayName;
    const safeCity = sanitizeInput(city || "São Paulo");
    const safeSubDistrict = sanitizeInput(subDistrict || "");
    const safeDistrict = sanitizeInput(district || "Geral");
    const safeOrg = sanitizeInput(organization || "Distrito Geral");
    const safeHorizontalGroup = sanitizeInput(horizontalGroup || "");
    const safeLocalGroup = sanitizeInput(localGroup || "");

    const finalAvatar = avatar || DEFAULT_AVATAR;
    user = {
      id,
      name: safeName,
      displayName: safeDisplayName,
      email: email.toLowerCase(),
      avatar: finalAvatar,
      city: safeCity,
      state: "SP",
      division: division || "JS",
      organization: safeOrg,
      district: safeDistrict,
      region: region || "Região Geral",
      subDistrict: safeSubDistrict,
      streak: 1,
      daimokuBalance: 0,
      horizontalGroup: safeHorizontalGroup,
      localGroup: safeLocalGroup,
      horizontalGroupOfficial: horizontalGroupOfficial === undefined ? true : !!horizontalGroupOfficial,
      lastActive: new Date().toISOString(),
      trialEnds: new Date(Date.now() + 30 * 86400000).toISOString()
    };
    dbData.users.push(user);
    
    // Create initial subscription and kofu empty records
    dbData.bs_subscription.push({
      userId: user.id,
      status: "nao_assinante",
      renewalDate: "",
      currentStreakMonths: 0
    });
    dbData.kofu.push({
      userId: user.id,
      campaignId: "campanha_3_2026",
      status: "nao_realizado",
      updatedAt: new Date().toISOString()
    });
    writeDB(dbData, req.idToken);
    
    // Send welcome email immediately in background
    sendConfirmationEmail(user).catch(err => {
      console.error("[EMAIL SYSTEM] Legacy registration email trigger error:", err);
    });
  } else {
    // Usuário existente reconhecido: Restaurar perfil e atualizar streak sem double-login inflation
    const logTimestamp = new Date().toISOString();
    if (req.idToken) {
      await syncUserFromFirestore(user.id, req.idToken);
    }
    updateAndCalculateUserStreak(user, dbData, logTimestamp);
    user.lastActive = logTimestamp;
    writeDB(dbData, req.idToken);
  }

  res.json(user);
});

// Dedicated endpoint for Acessar Conta (Aba 1) - Only allows existing users
app.post("/api/auth/login", (req: any, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "E-mail é obrigatório." });
  }

  // Strict email format and length validation
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Formato de e-mail inválido ou tamanho excessivo." });
  }

  const dbData = readDB();
  const user = dbData.users.find((u: any) => 
    u.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return res.status(404).json({
      error: "Este e-mail não possui cadastro no BodhiShape. Por favor, utilize a aba de Novos Bodhishapers para se cadastrar."
    });
  }

  // Restore profile state and update streak naturally without double-login inflation
  const logTimestamp = new Date().toISOString();
  updateAndCalculateUserStreak(user, dbData, logTimestamp);
  user.lastActive = logTimestamp;
  writeDB(dbData, req.idToken);

  res.json(user);
});

// Endpoint de estágio de cadastro persistente no servidor, para mitigar perdas em abas privadas/novas
app.post("/api/auth/stage-registration", (req: any, res) => {
  const { email, ...details } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "E-mail é obrigatório." });
  }

  // Validação estrita do padrão de E-mail
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Formato de E-mail inválido." });
  }

  const dbData = readDB();
  dbData.staged_registrations = dbData.staged_registrations || [];

  // Purgar registros com mais de 1 hora
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  dbData.staged_registrations = dbData.staged_registrations.filter((sr: any) => {
    return sr.stagedAt && new Date(sr.stagedAt).getTime() >= oneHourAgo;
  });
  
  // Remove eventuais estágios anteriores para o mesmo e-mail
  dbData.staged_registrations = dbData.staged_registrations.filter((sr: any) => sr.email.toLowerCase() !== email.toLowerCase());
  
  dbData.staged_registrations.push({
    email: email.toLowerCase(),
    details,
    stagedAt: new Date().toISOString()
  });
  
  writeDB(dbData);
  res.json({ success: true });
});

function migrateUserIdInDB(dbData: any, oldId: string, newId: string) {
  if (!oldId || !newId || oldId === newId) return;

  // 1. Users table
  const user = dbData.users.find((u: any) => u.id === oldId);
  if (user) {
    user.id = newId;
  }

  // 2. Kofu table
  if (dbData.kofu) {
    dbData.kofu.forEach((k: any) => {
      if (k.userId === oldId) k.userId = newId;
      if (k.id && k.id.startsWith(oldId + "_")) {
        k.id = k.id.replace(oldId + "_", newId + "_");
      }
    });
  }

  // 3. BS Subscription table
  if (dbData.bs_subscription) {
    dbData.bs_subscription.forEach((s: any) => {
      if (s.userId === oldId) s.userId = newId;
      if (s.id === oldId) s.id = newId;
    });
  }

  // 4. Activities table
  if (dbData.activities) {
    dbData.activities.forEach((a: any) => {
      if (a.userId === oldId) a.userId = newId;
    });
  }

  // 5. Posts table
  if (dbData.posts) {
    dbData.posts.forEach((p: any) => {
      if (p.userId === oldId) p.userId = newId;
    });
  }

  // 6. Goals table
  if (dbData.goals) {
    dbData.goals.forEach((g: any) => {
      if (g.userId === oldId) g.userId = newId;
    });
  }

  // 7. Chats table
  if (dbData.chats) {
    dbData.chats.forEach((c: any) => {
      if (c.userId === oldId) c.userId = newId;
    });
  }

  // 8. Reminders table
  if (dbData.reminders) {
    dbData.reminders.forEach((r: any) => {
      if (r.userId === oldId) r.userId = newId;
    });
  }

  // 9. Stories table
  if (dbData.stories) {
    dbData.stories.forEach((st: any) => {
      if (st.userId === oldId) st.userId = newId;
    });
  }
}

// Dedicated endpoint for Novos Bodhishapers (Aba 2) - Only allows new sign ups
app.post("/api/auth/register", async (req: any, res) => {
  const {
    id: bodyId,
    email,
    name: bodyName,
    displayName: bodyDisplayName,
    avatar: bodyAvatar,
    division: bodyDivision,
    region: bodyRegion,
    subDistrict: bodySubDistrict,
    district: bodyDistrict,
    community: bodyCommunity,
    block: bodyBlock,
    horizontalGroup: bodyHorizontalGroup,
    birthdate: bodyBirthdate
  } = req.body;

  if (!email) {
    return res.status(400).json({ error: "E-mail é obrigatório." });
  }

  const dbData = readDB();
  dbData.staged_registrations = dbData.staged_registrations || [];

  // Purgar registros de estágio expirados com mais de 1 hora
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  dbData.staged_registrations = dbData.staged_registrations.filter((sr: any) => {
    return sr.stagedAt && new Date(sr.stagedAt).getTime() >= oneHourAgo;
  });

  const staged = dbData.staged_registrations.find((sr: any) => sr.email.toLowerCase() === email.toLowerCase());
  const stagedDetails = staged ? staged.details : {};

  // Fusão segura dos dados: Parâmetros do body têm preferência, depois dados em estágio
  const name = bodyName || stagedDetails.name;
  const displayName = bodyDisplayName || stagedDetails.displayName;
  const avatar = bodyAvatar || stagedDetails.avatar;
  const division = bodyDivision || stagedDetails.division;
  const region = bodyRegion || stagedDetails.region;
  const subDistrict = bodySubDistrict || stagedDetails.subDistrict;
  const district = bodyDistrict || stagedDetails.district;
  const community = bodyCommunity || stagedDetails.community;
  const block = bodyBlock || stagedDetails.block;
  const horizontalGroup = bodyHorizontalGroup || stagedDetails.horizontalGroup;
  const birthdate = bodyBirthdate || stagedDetails.birthdate || "";

  if (!name || !displayName) {
    return res.status(400).json({ error: "Nome completo e como gostaria de ser chamado(a) são obrigatórios." });
  }

  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Formato de e-mail inválido." });
  }

  if (avatar && !isValidImageURL(avatar)) {
    return res.status(400).json({ error: "Formato ou endereço da foto de perfil suscetível a bloqueio de segurança." });
  }

  // Support UIDs from Firebase Auth Token if available
  let id = bodyId || "user-" + Math.random().toString(36).substr(2, 9);
  if (req.idToken && firebaseConfig) {
    const payload = await verifyFirebaseToken(req.idToken, firebaseConfig.projectId);
    if (payload) {
      id = payload.sub as string;
    }
  }

  const existingUser = dbData.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    // Se o login foi autenticado via e-mail link (req.idToken presente) mas o ID atual no DB é diferente (ex: id provisório offline),
    // realizamos a migração automática para unificar com o Firebase UID sem perder os dados históricos.
    if (existingUser.id !== id && req.idToken) {
      const oldId = existingUser.id;
      migrateUserIdInDB(dbData, oldId, id);
      
      // Mescla/atualiza as informações do perfil com as enviadas
      if (name) existingUser.name = sanitizeInput(name);
      if (displayName) existingUser.displayName = sanitizeInput(displayName);
      if (avatar) existingUser.avatar = avatar;
      if (division) existingUser.division = division;
      if (region) existingUser.region = sanitizeInput(region);
      if (subDistrict) existingUser.subDistrict = sanitizeInput(subDistrict);
      if (district) existingUser.district = sanitizeInput(district);
      if (community) existingUser.block = sanitizeInput(block);
      if (horizontalGroup) existingUser.horizontalGroup = sanitizeInput(horizontalGroup);
      if (birthdate) existingUser.birthdate = birthdate;
      existingUser.updatedAt = new Date().toISOString();

      // Limpa os registros de estágio após cadastro bem-sucedido
      dbData.staged_registrations = (dbData.staged_registrations || []).filter((sr: any) => sr.email.toLowerCase() !== email.toLowerCase());

      writeDB(dbData, req.idToken);

      // Envia e-mail de boas-vindas assincronamente (sem bloquear) se o e-mail estiver configurado
      sendConfirmationEmail(existingUser).catch(err => {
        console.error("[EMAIL SYSTEM] Existing user migrated welcome email trigger error:", err);
      });

      return res.json(existingUser);
    }

    return res.status(400).json({
      error: "Este e-mail já possui cadastro. Por favor, utilize a aba Acessar Conta para entrar."
    });
  }

  const safeName = sanitizeInput(name);
  const safeDisplayName = sanitizeInput(displayName);
  const safeCity = sanitizeInput(community || "São Paulo");
  const safeSubDistrict = sanitizeInput(subDistrict || "");
  const safeDistrict = sanitizeInput(district || "Geral");
  const safeOrg = sanitizeInput(community || "Distrito Geral");
  const safeBlock = sanitizeInput(block || "");
  const safeHorizontalGroup = sanitizeInput(horizontalGroup || "");

  const finalAvatar = avatar || DEFAULT_AVATAR;
  const user = {
    id,
    name: safeName,
    displayName: safeDisplayName,
    email: email.toLowerCase(),
    avatar: finalAvatar,
    city: safeCity,
    state: "SP",
    division: division || "JS", // "JS", "DF" or "DS"
    organization: safeOrg,
    district: safeDistrict,
    region: region || "Região Geral",
    subDistrict: safeSubDistrict,
    block: safeBlock,
    streak: 1,
    daimokuBalance: 0,
    horizontalGroup: safeHorizontalGroup,
    localGroup: "",
    horizontalGroupOfficial: true,
    lastActive: new Date().toISOString(),
    trialEnds: new Date(Date.now() + 30 * 86400000).toISOString(),
    birthdate
  };

  dbData.users.push(user);

  // Sync initial sub and contribution models
  dbData.bs_subscription.push({
    userId: user.id,
    status: "nao_assinante",
    renewalDate: "",
    currentStreakMonths: 0
  });

  dbData.kofu.push({
    userId: user.id,
    campaignId: "campanha_3_2026",
    status: "nao_realizado",
    updatedAt: new Date().toISOString()
  });

  // Limpa o estágio após cadastro bem-sucedido
  dbData.staged_registrations = dbData.staged_registrations.filter((sr: any) => sr.email.toLowerCase() !== email.toLowerCase());

  writeDB(dbData, req.idToken);

  // Send welcome HTML email background job
  sendConfirmationEmail(user).catch(err => {
    console.error("[EMAIL SYSTEM] Main registration email trigger error:", err);
  });

  res.json(user);
});

// Desativado endpoint de recuperação de senha por dica
app.post("/api/auth/recover-hint", (req, res) => {
  res.status(400).json({ error: "O BodhiShape agora utiliza login sem senhas. Não há senha para ser recuperada nesta versão." });
});

// Configure serving for custom uploaded progress and avatar images
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Fallback/Recovery route for uploaded images when container restarts on Cloud Run
app.get("/uploads/:filename", (req, res, next) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  // Seek on Firestore mirrored in-memory state
  try {
    const dbData = readDB();
    const mediaList = dbData.persistent_media || [];
    const media = mediaList.find((m: any) => m.id === filename);
    if (media && media.dataUrl) {
      const matches = media.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const imageBuffer = Buffer.from(matches[2], 'base64');
        const contentType = matches[1];

        // Cache writeback locally to filesystem
        fs.writeFileSync(filePath, imageBuffer);
        const distUploads = path.join(process.cwd(), "dist", "uploads");
        if (fs.existsSync(path.join(process.cwd(), "dist"))) {
          if (!fs.existsSync(distUploads)) {
            fs.mkdirSync(distUploads, { recursive: true });
          }
          fs.writeFileSync(path.join(distUploads, filename), imageBuffer);
        }

        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=31536000");
        return res.send(imageBuffer);
      }
    }
  } catch (err) {
    console.error("Failed to restore dynamic persistent image:", err);
  }

  next();
});

app.use("/uploads", express.static(uploadsDir));

app.post("/api/upload", (req, res) => {
  try {
    const { image, name } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Nenhuma imagem enviada." });
    }
    
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Formato de imagem inválido." });
    }
    
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const ext = matches[1].split('/')[1] || 'png';
    const filename = `photo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    
    // Write in public folder
    const publicDest = path.join(uploadsDir, filename);
    fs.writeFileSync(publicDest, imageBuffer);
    
    // For hot reload consistency or production builds, also write to dist folder if it exists
    const distUploads = path.join(process.cwd(), "dist", "uploads");
    if (fs.existsSync(path.join(process.cwd(), "dist"))) {
      if (!fs.existsSync(distUploads)) {
        fs.mkdirSync(distUploads, { recursive: true });
      }
      fs.writeFileSync(path.join(distUploads, filename), imageBuffer);
    }

    // Persist permanently in Firestore database as persistent_media
    const dbData = readDB();
    dbData.persistent_media = dbData.persistent_media || [];
    dbData.persistent_media.push({
      id: filename,
      dataUrl: image,
      createdAt: new Date().toISOString()
    });

    // Guard: Prevent exploding the collection beyond 200 items to conserve memory and space, keeping active ones
    if (dbData.persistent_media.length > 200) {
      const removedItem = dbData.persistent_media.shift();
      if (removedItem) {
        removeDoc("persistent_media", removedItem.id);
      }
    }

    writeDB(dbData);
    
    res.json({ url: `/uploads/${filename}` });
  } catch (err: any) {
    console.error("Upload handler error:", err);
    res.status(500).json({ error: "Falha ao gravar arquivo de imagem no servidor de produção." });
  }
});

// Update User Profile route
app.post("/api/users/update", async (req: any, res) => {
  const { 
    userId, name, displayName, avatar, city, division, organization, district, subDistrict, region,
    height, initialWeight, currentWeight, targetWeight, weightHistory, bodyMeasurements, progressPhotos,
    daimokuBalance, block, localGroup, horizontalGroup, horizontalGroupOfficial, accessibility,
    pushEnabled, pushToken, birthdate, lang, theme, socials
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "ID de usuário é obrigatório." });
  }

  // Sincroniza dados mais recentes em nuvem do usuário antes de mesclar novas atualizações
  if (req.idToken) {
    await syncUserFromFirestore(userId, req.idToken);
  }

  const dbData = readDB();
  const user = dbData.users.find((u: any) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  // Valide as informações
  if (name && (name.length > 80 || hasMalwareOrSuspiciousPatterns(name))) {
    return res.status(400).json({ error: "Nome contém caracteres inválidos ou suspeitos." });
  }
  if (displayName && (displayName.length > 80 || hasMalwareOrSuspiciousPatterns(displayName))) {
    return res.status(400).json({ error: "Nome de exibição contém caracteres inválidos ou suspeitos." });
  }
  if (avatar && !isValidImageURL(avatar)) {
    return res.status(400).json({ error: "Foto de perfil suspeita bloqueada por segurança." });
  }

  const safeName = name !== undefined ? sanitizeInput(name) : user.name;
  const safeDisplayName = displayName !== undefined ? sanitizeInput(displayName) : (user.displayName || "");
  const safeCity = city !== undefined ? sanitizeInput(city) : user.city;
  const safeDistrict = district !== undefined ? sanitizeInput(district) : user.district;
  const safeOrg = organization !== undefined ? sanitizeInput(organization) : user.organization;
  const safeSubDistrict = subDistrict !== undefined ? sanitizeInput(subDistrict) : (user.subDistrict || "");

  // Update user fields
  user.name = safeName || user.name;
  user.displayName = safeDisplayName;
  if (avatar !== undefined) user.avatar = avatar;
  if (city !== undefined) user.city = safeCity;
  if (division !== undefined) user.division = division;
  if (organization !== undefined) user.organization = safeOrg;
  if (district !== undefined) user.district = safeDistrict;
  if (subDistrict !== undefined) user.subDistrict = safeSubDistrict;
  if (region !== undefined) user.region = region;
  if (birthdate !== undefined) user.birthdate = birthdate;

  // Rich metrics updates
  if (height !== undefined) user.height = height === null ? null : Number(height);
  if (initialWeight !== undefined) user.initialWeight = initialWeight === null ? null : Number(initialWeight);
  if (currentWeight !== undefined) user.currentWeight = currentWeight === null ? null : Number(currentWeight);
  if (targetWeight !== undefined) user.targetWeight = targetWeight === null ? null : Number(targetWeight);
  if (weightHistory !== undefined) user.weightHistory = weightHistory;
  if (bodyMeasurements !== undefined) user.bodyMeasurements = bodyMeasurements;
  if (progressPhotos !== undefined) user.progressPhotos = progressPhotos;
  if (daimokuBalance !== undefined) user.daimokuBalance = daimokuBalance === null ? null : Number(daimokuBalance);
  if (block !== undefined) user.block = block === null ? null : sanitizeInput(block);
  if (localGroup !== undefined) user.localGroup = localGroup === null ? null : sanitizeInput(localGroup);
  if (horizontalGroup !== undefined) user.horizontalGroup = horizontalGroup === null ? null : sanitizeInput(horizontalGroup);
  if (horizontalGroupOfficial !== undefined) user.horizontalGroupOfficial = horizontalGroupOfficial === null ? null : Boolean(horizontalGroupOfficial);
  if (accessibility !== undefined) user.accessibility = accessibility;
  if (pushEnabled !== undefined) user.pushEnabled = Boolean(pushEnabled);
  if (pushToken !== undefined) user.pushToken = pushToken;
  if (lang !== undefined) user.lang = lang;
  if (theme !== undefined) user.theme = theme;
  if (socials !== undefined) user.socials = socials;
  
  user.lastActive = new Date().toISOString();

  // Propagate updates to cache-heavy posts & comments collections
  if (dbData.posts && Array.isArray(dbData.posts)) {
    dbData.posts.forEach((post: any) => {
      if (post.userId === userId) {
        post.userName = safeDisplayName || safeName || post.userName;
        if (avatar !== undefined) post.userAvatar = avatar;
        if (division !== undefined) post.userDivision = division;
        if (region !== undefined) post.userRegion = region;
      }
      if (post.comments && Array.isArray(post.comments)) {
        post.comments.forEach((comment: any) => {
          if (comment.userId === userId) {
            comment.userName = safeDisplayName || safeName || comment.userName;
            if (avatar !== undefined) comment.userAvatar = avatar;
          }
        });
      }
    });
  }

  // Propagate updates to chat messages
  if (dbData.chats && Array.isArray(dbData.chats)) {
    dbData.chats.forEach((chatMsg: any) => {
      if (chatMsg.userId === userId) {
        chatMsg.userName = safeDisplayName || safeName || chatMsg.userName;
        if (avatar !== undefined) chatMsg.userAvatar = avatar;
      }
    });
  }

  writeDB(dbData, req.idToken);
  res.json(user);
});

// Fetch full user contextual dashboard state
app.get("/api/dashboard-stats/:userId", async (req: any, res) => {
  const { userId } = req.params;

  // Sincroniza dados históricos reais do Firestore antes de retornar estatísticas
  if (req.idToken) {
    await syncUserFromFirestore(userId, req.idToken);
  }

  const dbData = readDB();

  const user = dbData.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  const oldStreak = user.streak || 0;
  updateAndCalculateUserStreak(user, dbData);
  if ((user.streak || 0) !== oldStreak) {
    writeDB(dbData, req.idToken);
  }

  const userActivities = dbData.activities.filter((a: any) => a.userId === userId);
  const userKofu = dbData.kofu.find((k: any) => k.userId === userId) || { campaignId: "campanha_3_2026", status: "nao_realizado" };
  const userBs = dbData.bs_subscription.find((b: any) => b.userId === userId) || { status: "nao_assinante", renewalDate: "" };
  const userGoals = dbData.goals.filter((g: any) => g.userId === userId);

  // Compute total Daimoku stats
  const daimokuActs = userActivities.filter((a: any) => a.type === "daimoku");
  const totalDaimokuMinutes = daimokuActs.reduce((sum: number, a: any) => sum + (a.minutes || 0), 0);
  const totalDaimokuHours = Number((totalDaimokuMinutes / 60).toFixed(1));

  // Compute exercises stats
  const exerciseActs = userActivities.filter((a: any) => a.type === "exercise");
  const totalExerciseActivities = exerciseActs.length;

  // Compile response
  res.json({
    user,
    activities: userActivities,
    kofu: userKofu,
    bs: userBs,
    goals: userGoals,
    stats: {
      totalDaimokuMinutes,
      totalDaimokuHours,
      totalExerciseActivities,
      streak: user.streak || 0
    }
  });
});

// Logs activities and triggers calculations + automated IA comments
app.post("/api/activities/log", async (req, res) => {
  const { userId, type, minutes, exerciseCategory, exerciseType, notes, customTimestamp, startTimestamp, endTimestamp } = req.body;

  // Proteção rigorosa contra injeção de parâmetros e scripts maliciosos nos logs de atividade
  if (!userId || userId.length > 128 || hasMalwareOrSuspiciousPatterns(userId)) {
    return res.status(400).json({ error: "Identificador de usuário inválido." });
  }
  if (notes && (notes.length > 2000 || hasMalwareOrSuspiciousPatterns(notes))) {
    return res.status(400).json({ error: "Observações contêm scripts ou termos não permitidos." });
  }

  const safeNotes = sanitizeInput(notes);
  const dbData = readDB();

  const user = dbData.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Usuário não cadastrado." });
  }

  const logTimestamp = customTimestamp || new Date().toISOString();
  const logDate = new Date(logTimestamp);
  const now = new Date();
  
  // 14 days historical retro check
  const maxRetroDays = 14;
  const maxHistoryCutoff = now.getTime() - maxRetroDays * 24 * 60 * 60 * 1000;
  if (logDate.getTime() < maxHistoryCutoff) {
    return res.status(400).json({ error: `Registros retroativos são limitados a no máximo ${maxRetroDays} dias.` });
  }
  
  // Block logging in future dates
  if (logDate.getTime() > now.getTime() + 12 * 60 * 60 * 1000) {
    return res.status(400).json({ error: "Não é permitido registrar atividades em datas futuras." });
  }

  // Prevent double submissions or double click logging
  const recentDuplicate = dbData.activities.some((a: any) => 
    a.userId === userId &&
    a.type === type &&
    Math.abs(new Date(a.timestamp).getTime() - logDate.getTime()) < 3000
  );
  if (recentDuplicate) {
    return res.status(409).json({ error: "Duplicidade detectada. Por favor, aguarde alguns instantes." });
  }

  const targetDayStr = logTimestamp.split("T")[0];
  const userLogsForToday = dbData.activities.filter((a: any) => a.userId === userId && a.timestamp.startsWith(targetDayStr));

  let points = 0;
  let successMsg = "";
  
  if (type === "gongyo_morning") {
    // Gongyo Morning limit
    const alreadyLogged = userLogsForToday.find((a: any) => a.type === "gongyo_morning");
    if (alreadyLogged) {
      return res.status(400).json({ error: "Gongyo da Manhã já foi registrado hoje! Máximo de 1 ponto." });
    }
    points = 1;
    successMsg = "Gongyo da Manhã registrado com sucesso! +1 Ponto. 🪷 Dica amigável: Que tal registrar também nem que sejam 5, 10 ou 15 min de Daimoku para fechar seu foco? No BodhiShape, todos os minutos se acumulam progressivamente para pontuar e nenhum esforço é perdido! Todo daimoku importa! ✨";
  } else if (type === "gongyo_evening") {
    // Gongyo Evening limit
    const alreadyLogged = userLogsForToday.find((a: any) => a.type === "gongyo_evening");
    if (alreadyLogged) {
      return res.status(400).json({ error: "Gongyo da Tarde/Noite já foi registrado hoje! Máximo de 1 ponto." });
    }
    points = 1;
    successMsg = "Gongyo da Tarde/Noite registrado com sucesso! +1 Ponto. 🪷 Dica amigável: Que tal registrar também nem que sejam 5, 10 ou 15 min de Daimoku? No BodhiShape, todos os seus minutos acumulados se mantêm salvos para pontuação e cada segundo de persistência conta! ✨";
  } else if (type === "daimoku") {
    const mins = Number(minutes);
    if (isNaN(mins) || mins <= 0) {
      return res.status(400).json({ error: "Minutos de Daimoku inválidos." });
    }
    
    // REGRA DE ACÚMULO DE DAIMOKU PARA PONTUAÇÃO
    // A cada 30 minutos acumulados totais de daimoku histórico/progressivo: +1 ponto.
    // Limite de negócio rígido: máximo de 2 pontos por upload de Daimoku simples.
    const currentBalance = user.daimokuBalance || 0;
    const totalMinutes = currentBalance + mins;
    let rawPoints = Math.floor(totalMinutes / 30);
    points = rawPoints > 2 ? 2 : rawPoints;
    const newBalance = totalMinutes % 30;
    
    user.daimokuBalance = newBalance;
    
    successMsg = `Registrados ${mins} minutos de Daimoku! Seu saldo anterior era de ${currentBalance} min. Total acumulado: ${totalMinutes} min. Você ganhou +${points} ${points === 1 ? 'ponto' : 'pontos'} (limitado a 2 por upload)! Saldo restante acumulado para o próximo ponto: ${newBalance} min.`;
  } else if (type === "exercise") {
    const mins = Number(minutes);
    if (isNaN(mins) || mins <= 0) {
      return res.status(400).json({ error: "Minutos de exercício inválidos." });
    }
    if (mins < 20) {
      points = 0;
      successMsg = `Exercício de ${mins} min registrado. Observação: exercícios devem durar pelo menos 20 min para pontuar no ranking.`;
    } else {
      // Check if logged any exercise today. If so, points are 0 but we congratulate user (Max 2pt/day)
      const hasExerciseToday = userLogsForToday.some((a: any) => a.type === "exercise" && (a.minutes || 0) >= 20);
      if (hasExerciseToday) {
        points = 0;
        successMsg = `Exercício de ${mins} min registrado com parabéns! Você já pontuou por hoje (máximo de 2 pontos por dia).`;
      } else {
        points = 2;
        successMsg = `Treino de ${mins} min registrado! +2 pontos desbloqueados.`;
      }
    }
  }

  // Create activity record
  const newActivity = {
    id: "act-" + Math.random().toString(36).substr(2, 9),
    userId,
    type,
    category: exerciseCategory || "",
    subType: exerciseType || "",
    minutes: minutes ? Number(minutes) : undefined,
    duration: minutes ? Number(minutes) : undefined,
    points,
    notes: safeNotes || "",
    timestamp: logTimestamp,
    date: logTimestamp.split("T")[0],
    startTimestamp: startTimestamp || undefined,
    endTimestamp: endTimestamp || undefined
  };
  dbData.activities.push(newActivity);

  // Update user last active and streak dynamically with the new logic
  updateAndCalculateUserStreak(user, dbData, logTimestamp);
  user.lastActive = logTimestamp;
  
  // Format content for social feed post
  let postContent = "";
  if (type === "gongyo_morning") {
    postContent = `Realizei o Gongyo da Manhã logo cedo! Fortalecendo a vida para as batalhas do dia. 🪷🌅`;
  } else if (type === "gongyo_evening") {
    postContent = `Gongyo da Tarde/Noite concluído! Gratidão imensa por mais um dia repleto de desenvolvimento e vitórias cotidianas. 🪷🌃`;
  } else if (type === "daimoku") {
    postContent = `Sessão de ${minutes} minutos de Daimoku focada nos meus objetivos e vitórias de todos para o BodhiShape! 🪷🔥`;
  } else if (type === "exercise") {
    postContent = `Treino concluído: ${exerciseCategory} (${exerciseType}) por ${minutes} minutos. Corpo ativo, determinação blindada! ${notes ? `"${notes}"` : ""} 💪⚡`;
  }

  // Choose a custom visual standard banner for social post
  let postImg = "";
  if (type === "exercise") {
    const gymPics = [
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600",
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600"
    ];
    postImg = gymPics[Math.floor(Math.random() * gymPics.length)];
  } else {
    const zenPics = [
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600",
      "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600"
    ];
    postImg = zenPics[Math.floor(Math.random() * zenPics.length)];
  }

  // Create Feed Post
  const newPostId = "post-" + Math.random().toString(36).substr(2, 9);
  const newPost = {
    id: newPostId,
    userId: user.id,
    userName: user.displayName || user.name,
    userAvatar: user.avatar,
    userDivision: user.division,
    userRegion: user.region,
    content: postContent,
    image: postImg,
    timestamp: logTimestamp,
    reactions: { "❤️": [], "🔥": [], "💪": [], "👏": [], "🌟": [] },
    comments: [] as any[]
  };

  dbData.posts.unshift(newPost);
  writeDB(dbData);

  res.json({ success: true, message: successMsg, activity: newActivity, post: newPost });
});

// Create combined activity log and optional social feed post (Gymrats-inspired flow)
app.post("/api/activities/log-combined", async (req, res) => {
  const {
    userId,
    content,
    image,
    video,
    noPublish,
    gongyoMorning,
    gongyoEvening,
    daimoku,
    daimokuMinutes,
    exercise,
    exerciseCategory,
    exerciseType,
    exerciseDate,
    exerciseTime,
    exerciseDuration,
    exerciseLocation,
    exerciseDistance,
    exerciseCalories,
    exerciseSteps,
    exerciseNotes
  } = req.body;

  const dbData = readDB();
  const user = dbData.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Usuário não cadastrado." });
  }

  // Prevent double click combined updates / duplicate postings within 3 seconds
  if (dbData.posts && dbData.posts.length > 0) {
    const userPosts = dbData.posts.filter((p: any) => p.userId === userId);
    if (userPosts.length > 0) {
      const lastPost = userPosts[0]; // first is newest
      if (lastPost.timestamp && (Date.now() - new Date(lastPost.timestamp).getTime()) < 3000) {
        return res.status(409).json({ error: "Você realizou um envio recentemente. Aguarde alguns instantes." });
      }
    }
  }

  const logTimestamp = new Date().toISOString();
  const targetDayStr = logTimestamp.split("T")[0];
  const userLogsForToday = dbData.activities.filter(
    (a: any) => a.userId === userId && a.timestamp.startsWith(targetDayStr)
  );

  let pointsEarned = 0;
  const createdActivities: any[] = [];
  const lines: string[] = [];

  // 1. Gongyo Morning
  if (gongyoMorning) {
    const alreadyLogged = userLogsForToday.some((a: any) => a.type === "gongyo_morning");
    if (!alreadyLogged) {
      const p = 1;
      pointsEarned += p;
      const mAct = {
        id: "act-" + Math.random().toString(36).substr(2, 9),
        userId,
        type: "gongyo_morning",
        points: p,
        timestamp: logTimestamp
      };
      dbData.activities.push(mAct);
      createdActivities.push(mAct);
    } else {
      // already logged today, count 0 points
    }
    lines.push("🌅 Gongyo Manhã");
  }

  // 2. Gongyo Evening
  if (gongyoEvening) {
    const alreadyLogged = userLogsForToday.some((a: any) => a.type === "gongyo_evening");
    if (!alreadyLogged) {
      const p = 1;
      pointsEarned += p;
      const eAct = {
        id: "act-" + Math.random().toString(36).substr(2, 9),
        userId,
        type: "gongyo_evening",
        points: p,
        timestamp: logTimestamp
      };
      dbData.activities.push(eAct);
      createdActivities.push(eAct);
    } else {
      // already logged today
    }
    lines.push("🌃 Gongyo Noite");
  }

  // 3. Daimoku
  const dMins = Number(daimokuMinutes) || 0;
  if (daimoku && dMins > 0) {
    const currentBalance = user.daimokuBalance || 0;
    const totalMinutes = currentBalance + dMins;
    let dPoints = Math.floor(totalMinutes / 30);
    if (dPoints > 2) {
      dPoints = 2;
    }
    const newBalance = totalMinutes % 30;
    
    user.daimokuBalance = newBalance;

    pointsEarned += dPoints;
    const dAct = {
      id: "act-" + Math.random().toString(36).substr(2, 9),
      userId,
      type: "daimoku",
      minutes: dMins,
      duration: dMins,
      points: dPoints,
      timestamp: logTimestamp,
      date: logTimestamp.split("T")[0]
    };
    dbData.activities.push(dAct);
    createdActivities.push(dAct);
    lines.push(`🪷 Daimoku ${dMins} min (${dPoints} pt, saldo atual residual: ${newBalance} min)`);
  }

  // 4. Exercise
  const exMins = Number(exerciseDuration) || 0;
  if (exercise && exMins > 0) {
    let exPoints = 0;
    if (exMins >= 20) {
      const hasExerciseToday = userLogsForToday.some((a: any) => a.type === "exercise" && (a.minutes || 0) >= 20);
      exPoints = hasExerciseToday ? 0 : 2;
    }

    pointsEarned += exPoints;

    let exTimestamp = logTimestamp;
    if (exerciseDate) {
      try {
        const parts = exerciseDate.split("-");
        if (parts.length === 3) {
          exTimestamp = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0).toISOString();
        }
      } catch (e) {
        // fallback
      }
    }

    const exAct = {
      id: "act-" + Math.random().toString(36).substr(2, 9),
      userId,
      type: "exercise",
      category: exerciseCategory || "Exercício",
      subType: exerciseType || "Vários",
      minutes: exMins,
      points: exPoints,
      notes: exerciseNotes || "",
      timestamp: exTimestamp,
      location: exerciseLocation || undefined,
      distanceKm: exerciseDistance ? Number(exerciseDistance) : undefined,
      calories: exerciseCalories ? Number(exerciseCalories) : undefined,
      steps: exerciseSteps ? Number(exerciseSteps) : undefined
    };
    dbData.activities.push(exAct);
    createdActivities.push(exAct);

    let exLine = `💪 ${exerciseCategory} ${exMins} min`;
    if (exerciseDistance) exLine += ` - ${exerciseDistance} km`;
    if (exerciseCalories) exLine += ` - ${exerciseCalories} kcal`;
    lines.push(exLine);
  }

  // Update user active stats and streak dynamically with the new logic
  updateAndCalculateUserStreak(user, dbData, logTimestamp);
  user.lastActive = logTimestamp;

  // 1. Calculate Current Leaderboard metrics for contextual comments
  const allUserPoints = dbData.users.map((u: any) => {
    const userActs = dbData.activities.filter((a: any) => a.userId === u.id);
    const totalPoints = userActs.reduce((sum: number, a: any) => sum + (a.points || 0), 0);
    return { id: u.id, points: totalPoints, streak: u.streak || 0 };
  }).sort((a: any, b: any) => b.points - a.points);

  const userRankIndex = allUserPoints.findIndex((x: any) => x.id === user.id);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : 10;
  const userIsTop = userRank <= 3;
  const totalCompetitors = allUserPoints.length;

  let finalPost = null;

  // Create customized social post if requested (or a presence-only post if checked!)
  if (noPublish) {
    // PRESENÇA PRIVADA COM PRESENÇA PÚBLICA MODES (As requested)
    let presenceText = "";
    if (gongyoMorning || gongyoEvening || daimoku) {
      presenceText = `🪷 ${user.displayName || user.name} registrou atividades de causação budista hoje.`;
    } else if (exercise) {
      presenceText = `💪 ${user.displayName || user.name} concluiu suas atividades físicas do dia.`;
    } else {
      presenceText = `🌟 ${user.displayName || user.name} manteve sua sequência ativa de revolucionário humana.`;
    }

    const newPostId = "post-" + Math.random().toString(36).substr(2, 9);
    finalPost = {
      id: newPostId,
      userId: user.id,
      userName: user.displayName || user.name,
      userAvatar: user.avatar,
      userDivision: user.division,
      userRegion: user.region,
      content: presenceText,
      image: "",
      timestamp: logTimestamp,
      reactions: { "❤️": [], "🔥": [], "💪": [], "👏": [], "🌟": [] },
      comments: [] as any[],
      loggedActivities: lines,
      pointsEarned: pointsEarned,
      isPresenceOnly: true,
      streak: user.streak || 1
    };

    dbData.posts.unshift(finalPost);

  } else {
    // Standard publication flow with custom content, image, details, and active AI feedback
    const finalImage = video || image || "";
    let initialText = content || "";
    
    // Format descriptive post string including our logged checklists
    let fullPostContent = initialText;
    if (lines.length > 0) {
      fullPostContent += (fullPostContent ? "\n\n" : "") + `Atividades:\n${lines.map(l => `✅ ${l}`).join("\n")}\n\n🏆 +${pointsEarned} pontos hoje`;
    } else {
      fullPostContent += (fullPostContent ? "\n\n" : "") + `Contabilizando meu dia de desenvolvimento pessoal.`;
    }

    const newPostId = "post-" + Math.random().toString(36).substr(2, 9);
    finalPost = {
      id: newPostId,
      userId: user.id,
      userName: user.displayName || user.name,
      userAvatar: user.avatar,
      userDivision: user.division,
      userRegion: user.region,
      content: fullPostContent,
      image: finalImage,
      timestamp: logTimestamp,
      reactions: { "❤️": [], "🔥": [], "💪": [], "👏": [], "🌟": [] },
      comments: [] as any[],
      loggedActivities: lines,
      pointsEarned: pointsEarned,
      isPresenceOnly: false,
      streak: user.streak || 1
    };

    // AI feedback comment with multi-category context support (top/climbing/gripe/absence/community)
    let aiCommentText = "";
    const apiKey = process.env.GEMINI_API_KEY;
    const initialTextLower = (initialText || "").toLowerCase();

    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && (lines.length > 0 || initialText.trim().length > 0)) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const aiPrompt = `
          Aja como um assistente de IA super divertido, brincalhão, motivador e profundamente humano do aplicativo 'BodhiShape' (onde a prática soka de Gongyo/Daimoku se une ao treino físico/academia).
          Seu objetivo é criar um sentimento de comunidade, incentivo e amizade sincera entre os praticantes, comentando tanto em momentos de vitória quanto de desafios de saúde, desânimo, recomeços e farras de prêmio.

          CONTEXTO DO COMPETIDOR NO RANKING:
          - Usuário está na posição #${userRank} de ${totalCompetitors} participantes gerais.
          - É considerado da "liderança" (Top 3)?: ${userIsTop ? "Sim, está no topo!" : "Não, mas lutando por posições."}
          - Ganhou +${pointsEarned} pontos com esta ação e tem ${user.streak} dias de sequência ativa.

          Gere um comentário único, curto e natural em Português do Brasil de acordo com as informações da postagem do usuário:
          - Nome do Usuário: ${user.displayName || user.name.split(" ")[0]}
          - Divisão: ${user.division} (e.g. JS, DF, DS)
          - Região Gakkai: ${user.region}
          - Atividades registradas hoje: ${lines.join(", ") || "Nenhuma atividade catalogada hoje, apenas relato"}
          - Mensagem escrita pelo usuário: "${initialText}"

          INSTRUÇÕES DE TOM E ESTILO DO GRUPO (SELECIONE A MELHOR CATEGORIA):
          1. Mantenha curto (no máximo 2-3 frases curtas e impactantes). Use emojis adequados.
          2. Seja extremamente contextual baseado nas categorias:
             a) DOENÇA/IMPREVISTOS (se falar em gripe, doente, febre, lesionado, dor, hospital, resfriado): mostre imensa empatia respeitosa e bem-humorada! Exemplos: "Descansar também faz parte da jornada", "Seu corpo está pedindo recuperação", "Até os Bodhishapers precisam de manutenção preventiva", "A gripe venceu a batalha de hoje, mas dificilmente vencerá a guerra."
             b) COMENTÁRIO PARA QUEM ESTÁ NO TOPO (se userIsTop for Sim): elogie a liderança saudável! Exemplos: "A liderança traz responsabilidade. Continue inspirando.", "Os Bodhishapers estão observando sua constância.", "Sua disciplina está fortalecendo toda a comunidade!"
             c) COMENTÁRIO PARA QUEM ESTÁ SUBINDO (se pointsEarned > 0 e userIsTop for Não): incentive a escalada! Exemplos: "Você está ganhando posições.", "A comunidade já percebe sua evolução.", "O topo está cada vez mais próximo. Sua consistência está fazendo diferença!"
             d) AUSÊNCIA/DESÂNIMO/RETORNO (se falar em cansado, sumido, voltei, desânimo, exausto, parado, ritmo): comemore o retorno ou acalente! Exemplos: "O importante não é nunca parar. É sempre retornar.", "Sua presença faz falta por aqui.", "Uma pausa não apaga todo o caminho percorrido."
             e) INSPIRAÇÃO COMUNITÁRIA (geral): "Sua publicação pode motivar alguém hoje.", "Sua constância inspira mais pessoas do que você imagina.", "A comunidade fica mais forte quando celebramos juntos."
             f) HUMOR/RECOMPENSAS (pizza, burger, doce): "O shape perdoa quando a disciplina impera!", "Pizza abençoada pelo Daimoku da manhã!"
          3. Use termos soka e shape como 'Bodhishaper', 'Kossen-rufu do shape', 'lapidar o espírito', 'suar o carma', 'revolução humana'.
          4. NÃO coloque aspas no comentário. Não use formatação markdown de cabeçalhos.
          5. Termine integrando ou citando a assinatura/lema oficial: "Suando o Karma, Conquistando Vitórias!" ou semelhante.
        `;
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: aiPrompt,
        });
        aiCommentText = response.text?.trim() || "";
      } catch (e) {
        console.error("Erro no Gemini ao comentar post combinado:", e);
      }
    }

    if (!aiCommentText) {
      // SMART KEYWORD FALLBACK ENGINE FOR MAXIMUM RELIABILITY (Fully updated classes representing requested quotes)
      if (initialTextLower.includes("gripad") || initialTextLower.includes("doent") || initialTextLower.includes("febre") || initialTextLower.includes("gripe") || initialTextLower.includes("recuper") || initialTextLower.includes("hospital") || initialTextLower.includes("dói") || initialTextLower.includes("dor")) {
        const illnessCmts = [
          `Até os Bodhishapers precisam de manutenção preventiva, ${user.displayName || user.name.split(" ")[0]}! 🤒 Descansar também faz parte da jornada de revolução humana. Seu corpo está pedindo recuperação agora.`,
          `Recuperação também é treinamento, ${user.displayName || user.name.split(" ")[0]}! 💙 A gripe venceu a batalha de hoje, mas dificilmente vencerá a guerra soka. Descanse com carinho e se cure!`
        ];
        aiCommentText = illnessCmts[Math.floor(Math.random() * illnessCmts.length)];
      } 
      else if (initialTextLower.includes("pizza") || initialTextLower.includes("hambúrguer") || initialTextLower.includes("burguer") || initialTextLower.includes("mereço") || initialTextLower.includes("cheat") || initialTextLower.includes("lixo") || initialTextLower.includes("cerveja") || initialTextLower.includes("recompensa")) {
        aiCommentText = `Aproveite bem a vitória, ${user.displayName || user.name.split(" ")[0]}! 🍕 O shape perdoa quando a disciplina diária impera. Pizza abençoada pelo Daimoku matinal! Amanhã voltamos ao foco duplo.`;
      } 
      else if (initialTextLower.includes("corri") || initialTextLower.includes("corrida") || initialTextLower.includes(" km") || initialTextLower.includes("asfalto") || initialTextLower.includes("esteira") || initialTextLower.includes("ritmo")) {
        aiCommentText = `As pernas reclamaram mas você venceu a mente, Bodhishaper! 🏃⚡ Cada quilômetro vencido sob o sol da determinação é more um carma deixado para trás. O asfalto tremeu com esse ritmo!`;
      } 
      else if (initialTextLower.includes("cansad") || initialTextLower.includes("desânim") || initialTextLower.includes("sem energia") || initialTextLower.includes("difícil") || initialTextLower.includes("preguiç") || initialTextLower.includes("esforço") || initialTextLower.includes("marasmo")) {
        aiCommentText = `O pouco que realizamos com sinceridade vale ouro puro, ${user.displayName || user.name.split(" ")[0]}! 🍃 A direção é mais importante que a velocidade em nossa jornada soka. Gongyo feito sob esforço e superando as adversidades gera imensos recursos!`;
      } 
      else if (initialTextLower.includes("voltei") || initialTextLower.includes("recomeç") || initialTextLower.includes("sumid") || initialTextLower.includes("ausent") || initialTextLower.includes("semana difícil")) {
        aiCommentText = `Grande retorno, guerreiro inovador! 🌤️ O importante nunca é cair, mas sim levantar de prontidão. A vida se renova a cada novo Daimoku. O importante não é nunca parar. É sempre retornar!`;
      } 
      else if (initialTextLower.includes("parceria") || initialTextLower.includes("amigo") || initialTextLower.includes("junto") || initialTextLower.includes("dupla") || initialTextLower.includes("brother") || initialTextLower.includes("bobo") || initialTextLower.includes("treino em grupo")) {
        aiCommentText = `Parceria de ferro! 💎 Amigos de fé lapidam uns aos outros no caminho correto. Dois guerreiros do BodhiShape treinando com determinação incomodam muita preguiça!`;
      } 
      else {
        // Evaluate based on ranking position for competitive quotes
        if (userIsTop) {
          const topCmts = [
            `A liderança traz responsabilidade, ${user.displayName || user.name.split(" ")[0]}! 🏆 Continue inspirando toda a comunidade de Bodhishapers com seus treinos e Daimokus dedicados!`,
            `Os Bodhishapers estão observando de perto sua grandiosa constância! 🌟 Sua disciplina inabalável está fortalecendo de forma prática todo o nosso distrito!`,
            `Quem lidera também inspira de forma exemplar, ${user.displayName || user.name.split(" ")[0]}! 💪 Seu foco diário polirá sua revolução humana de forma profunda!`
          ];
          aiCommentText = topCmts[Math.floor(Math.random() * topCmts.length)];
        } else if (pointsEarned > 0) {
          const climbingCmts = [
            `Você está ganhando posições no ranking geral do shape, ${user.displayName || user.name.split(" ")[0]}! 🚀 A comunidade inteira já percebe e admira a sua evolução consistente!`,
            `O topo do pódio está cada vez mais próximo, Bodhishaper! 🏆 Sua consistência diária está fazendo tamanha diferença na sua saúde e na nossa amizade!`,
            `Que subida vertiginosa! 🔥 Seu esforço no altar e no supino está abrindo caminhos claros para sua vitória cotidiana!`
          ];
          aiCommentText = climbingCmts[Math.floor(Math.random() * climbingCmts.length)];
        } else {
          // Standard activity check fallbacks with Community Inspiration
          const communityCmts = [
            `Sua publicação e constância inabalável podem motivar e inspirar outro Bodhishaper a levantar hoje! 🤝 A comunidade fica imensamente mais forte quando celebramos juntos!`,
            `Mais uma bela causa estabelecida! 🪷 Sua constância inspira muito mais pessoas do que você jamais imaginaria!`,
            `Líderes inspiram pelo autêntico exemplo diário, ${user.displayName || user.name.split(" ")[0]}! 💪 Os Bodhishapers estão crescendo e lapidando-se juntos!`
          ];
          aiCommentText = communityCmts[Math.floor(Math.random() * communityCmts.length)];
        }
      }
      aiCommentText = aiCommentText + " Lembre-se: Suando o Karma, Conquistando Vitórias! 🪷💪";
    }

    dbData.posts.unshift(finalPost);
  }

  writeDB(dbData);

  const loggedGongyo = gongyoMorning || gongyoEvening;
  const loggedDaimoku = daimoku && (Number(daimokuMinutes) || 0) > 0;
  let reminderSuggestion = "";
  if (loggedGongyo && !loggedDaimoku) {
    reminderSuggestion = " 🪷 Dica amigável: Cada minuto de Daimoku sincero (até mesmo 5, 10 ou 15 min) é precioso e se acumula progressivamente para pontuar sem pressa! Seu esforço é 100% valorizado no BodhiShape.";
  }

  res.json({
    success: true,
    pointsEarned,
    activitiesLoggedCount: createdActivities.length,
    post: finalPost,
    message: noPublish 
      ? `Atividades gravadas com sucesso no modo privado! +${pointsEarned} pontos adicionados ao seu ranking invisível. 🌱` + reminderSuggestion
      : `Sua publicação e atividades integradas de hoje foram gravadas! +${pointsEarned} pontos adicionados. 🏆` + reminderSuggestion
  });
});

// Get list of victory stories
app.get("/api/stories", (req, res) => {
  const dbData = readDB();
  const stories = dbData.stories || [];
  res.json(stories);
});

// Create a new victory story
app.post("/api/stories", (req, res) => {
  const { userId, userName, userAvatar, category, title, content } = req.body;
  if (!userId || !title || !content) {
    return res.status(400).json({ error: "Parâmetros obrigatórios ausentes." });
  }

  const dbData = readDB();
  if (!dbData.stories) {
    dbData.stories = [];
  }

  const newStory = {
    id: "story-" + Math.random().toString(36).substr(2, 9),
    userId,
    userName: sanitizeInput(userName) || "Praticante",
    userAvatar: userAvatar || DEFAULT_AVATAR,
    category: category || "beneficio",
    title: sanitizeInput(title),
    content: sanitizeInput(content),
    timestamp: new Date().toISOString(),
    likes: [],
    comments: []
  };

  dbData.stories.push(newStory);
  writeDB(dbData);
  res.json(newStory);
});

// Like/Unlike a victory story
app.post("/api/stories/:storyId/like", (req, res) => {
  const { storyId } = req.params;
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "ID de usuário é obrigatório." });
  }

  const dbData = readDB();
  const stories = dbData.stories || [];
  const story = stories.find((s: any) => s.id === storyId);
  if (!story) {
    return res.status(404).json({ error: "Relato de vitória não encontrado." });
  }

  if (!story.likes) story.likes = [];
  const index = story.likes.indexOf(userId);
  if (index === -1) {
    story.likes.push(userId);
  } else {
    story.likes.splice(index, 1);
  }

  writeDB(dbData);
  res.json(story);
});

// Comment on a victory story
app.post("/api/stories/:storyId/comment", (req, res) => {
  const { storyId } = req.params;
  const { userName, userAvatar, content } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Conteúdo do comentário é obrigatório." });
  }

  const dbData = readDB();
  const stories = dbData.stories || [];
  const story = stories.find((s: any) => s.id === storyId);
  if (!story) {
    return res.status(404).json({ error: "Relato de vitória não encontrado." });
  }

  if (!story.comments) story.comments = [];
  const newComment = {
    id: "comment-" + Math.random().toString(36).substr(2, 9),
    userName: userName || "Praticante Soka",
    userAvatar: userAvatar || DEFAULT_AVATAR,
    content: sanitizeInput(content),
    timestamp: new Date().toISOString()
  };

  story.comments.push(newComment);
  writeDB(dbData);
  res.json(story);
});

// Create customized user post
app.post("/api/posts", (req, res) => {
  const { userId, content, image } = req.body;

  // Proteção contra injeções de script de XSS e controle de tamanho da publicação
  if (!userId || userId.length > 128 || hasMalwareOrSuspiciousPatterns(userId)) {
    return res.status(400).json({ error: "Identificador de usuário inválido." });
  }
  if (content && (content.length > 5000 || hasMalwareOrSuspiciousPatterns(content))) {
    return res.status(400).json({ error: "O texto da publicação parece suspeito ou excede o limite." });
  }
  if (image && !isValidImageURL(image)) {
    return res.status(400).json({ error: "Formato ou endereço da imagem inválido." });
  }

  const safeContent = sanitizeInput(content);
  const dbData = readDB();

  const user = dbData.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  const publicAiTemplates = [
    "🪷 Seu karma está ficando sem argumentos de tanta determinação!",
    "💪 A preguiça tentou negociar com você hoje, mas perdeu feio!",
    "🔥 Mais uma vitória gloriosa registrada no livro da vida!",
    "🌟 Pequenas ações diárias geram gigantescas transformações na mente e no corpo.",
    "🏆 Cuidado! O topo do ranking geral soka já está sentindo a vibração da sua aproximação!",
    "😂 Os halteres pediram arrego hoje diante do tamanho do seu foco!",
    "🪷 Hoje foi Daimoku consagrado. Amanhã será benefício derramado!",
    "🚀 O universo inteiro anotou a sua determinação hoje com caneta de ouro.",
    "💪 Mais forte, mais determinado e muito mais sábio do que ontem!",
    "🔥 Suando o Karma, Conquistando Vitórias inabaláveis!"
  ];
  const chosenAiComment = publicAiTemplates[Math.floor(Math.random() * publicAiTemplates.length)];

  const newPost = {
    id: "post-" + Math.random().toString(36).substr(2, 9),
    userId: user.id,
    userName: user.displayName || user.name,
    userAvatar: user.avatar,
    userDivision: user.division,
    userRegion: user.region,
    content: safeContent || "",
    image: image || "",
    timestamp: new Date().toISOString(),
    reactions: { "❤️": [], "🔥": [], "💪": [], "👏": [], "🌟": [] },
    comments: [] as any[]
  };

  dbData.posts.unshift(newPost);
  writeDB(dbData);
  res.json(newPost);
});

// Delete social post
app.delete("/api/posts/:postId", (req, res) => {
  const { postId } = req.params;
  
  // Extract userId from body or query parameters
  let userId = req.body?.userId;
  if (!userId && req.query.userId) {
    userId = req.query.userId;
  }

  if (!userId) {
    return res.status(400).json({ error: "Identificador de usuário é obrigatório." });
  }

  const dbData = readDB();
  const user = dbData.users.find((u: any) => u.id === userId);
  const postIndex = dbData.posts.findIndex((p: any) => p.id === postId);

  if (postIndex === -1) {
    return res.status(404).json({ error: "Publicação não encontrada." });
  }

  const post = dbData.posts[postIndex];
  
  // Custom flexible verification: owner check, nickname match, name match, or admin override
  const isOwner = post.userId === userId;
  const isNameMatch = user && (post.userName === user.name || post.userName === user.displayName);
  const isAdmin = hasRole(user, "admin");

  if (!isOwner && !isNameMatch && !isAdmin) {
    return res.status(403).json({ error: "Não autorizado a excluir a publicação de terceiros." });
  }

  dbData.posts.splice(postIndex, 1);

  // Delete associated activities
  let deletedActivitiesCount = 0;
  if (dbData.activities) {
    const originalLength = dbData.activities.length;
    dbData.activities = dbData.activities.filter((a: any) => {
      // Check direct activity reference
      const isActivityMatch = post.activity && (a.id === post.activity.id || a.id === post.activityId || a.id === post.id);
      // Check timestamp matching for combined logging
      const isTimestampMatch = a.userId === post.userId && a.timestamp === post.timestamp;
      
      const shouldDelete = isActivityMatch || isTimestampMatch;
      return !shouldDelete;
    });
    deletedActivitiesCount = originalLength - dbData.activities.length;
  }

  // Recalculate user streak based on remaining activities
  if (user) {
    const userActs = dbData.activities.filter((a: any) => a.userId === user.id);
    let calculatedStreak = 0;
    if (userActs.length > 0) {
      const uniqueDays = Array.from(new Set(userActs.map((a: any) => a.timestamp.split("T")[0]))) as string[];
      uniqueDays.sort((a: string, b: string) => b.localeCompare(a));
      
      const todayStr = new Date().toISOString().split("T")[0];
      const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
        calculatedStreak = 1;
        for (let i = 0; i < uniqueDays.length - 1; i++) {
          const d1 = new Date(uniqueDays[i]);
          const d2 = new Date(uniqueDays[i + 1]);
          const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            calculatedStreak++;
          } else {
            break;
          }
        }
      }
    }
    user.streak = calculatedStreak;
    // Update user record in memory
    const userIdx = dbData.users.findIndex((u: any) => u.id === user.id);
    if (userIdx !== -1) {
      dbData.users[userIdx] = user;
    }
  }

  writeDB(dbData);
  res.json({ success: true, message: "Publicação e registros associados excluídos com sucesso.", deletedActivitiesCount });
});

// Edit social post
app.put("/api/posts/:postId", (req, res) => {
  const { postId } = req.params;
  const { userId, content, image, video, category, communityId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Identificador de usuário é obrigatório." });
  }
  if (content && (content.length > 5000 || hasMalwareOrSuspiciousPatterns(content))) {
    return res.status(400).json({ error: "Conteúdo da publicação suspeito ou excessivo." });
  }

  const dbData = readDB();
  const post = dbData.posts.find((p: any) => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: "Publicação não encontrada." });
  }

  const user = dbData.users.find((u: any) => u.id === userId);
  const isAdmin = hasRole(user, "admin");

  if (post.userId !== userId && !isAdmin) {
    return res.status(403).json({ error: "Não autorizado a editar a publicação de terceiros." });
  }

  post.content = sanitizeInput(content) || "";
  
  if (image !== undefined) post.image = image;
  if (video !== undefined) post.video = video;
  if (category !== undefined) post.category = category;
  if (communityId !== undefined) post.communityId = communityId;
  
  post.editedAt = new Date().toISOString();

  writeDB(dbData);
  res.json(post);
});

// Delete comment from a post
app.post("/api/posts/:postId/comments/:commentId/delete", (req, res) => {
  const { postId, commentId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Identificador de usuário é obrigatório." });
  }

  const dbData = readDB();
  const post = dbData.posts.find((p: any) => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: "Publicação não encontrada." });
  }

  if (!post.comments || !Array.isArray(post.comments)) {
    return res.status(404).json({ error: "Comentário não encontrado." });
  }

  const commentIndex = post.comments.findIndex((c: any) => c.id === commentId);
  if (commentIndex === -1) {
    return res.status(404).json({ error: "Comentário não encontrado." });
  }

  const comment = post.comments[commentIndex];
  const user = dbData.users.find((u: any) => u.id === userId);
  const isAdmin = hasRole(user, "admin");
  // Allow comment author or post owner or admin to delete comments
  if (comment.userId !== userId && post.userId !== userId && !isAdmin) {
    return res.status(403).json({ error: "Sem autorização para excluir este comentário." });
  }

  post.comments.splice(commentIndex, 1);
  writeDB(dbData);
  res.json(post);
});

// Edit comment on a post
app.post("/api/posts/:postId/comments/:commentId/update", (req, res) => {
  const { postId, commentId } = req.params;
  const { userId, content } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
  }
  if (content && (content.length > 1500 || hasMalwareOrSuspiciousPatterns(content))) {
    return res.status(400).json({ error: "Comentário suspeito ou excessivo." });
  }

  const dbData = readDB();
  const post = dbData.posts.find((p: any) => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: "Publicação não encontrada." });
  }

  if (!post.comments || !Array.isArray(post.comments)) {
    return res.status(404).json({ error: "Comentários não encontrados nesta publicação." });
  }

  const comment = post.comments.find((c: any) => c.id === commentId);
  if (!comment) {
    return res.status(404).json({ error: "Comentário não encontrado." });
  }

  const user = dbData.users.find((u: any) => u.id === userId);
  const isAdmin = hasRole(user, "admin");

  if (comment.userId !== userId && !isAdmin) {
    return res.status(403).json({ error: "Não autorizado a editar o comentário de terceiros." });
  }

  comment.content = sanitizeInput(content);
  comment.editedAt = new Date().toISOString();

  writeDB(dbData);
  res.json(post);
});

// React on social feed post
app.post("/api/posts/:postId/react", (req, res) => {
  const { postId } = req.params;
  const { userId, reaction } = req.body; // reaction: "❤️", "🔥", "💪", "👏", "🌟"

  const validReactions = ["❤️", "🔥", "💪", "👏", "🌟"];
  if (!validReactions.includes(reaction)) {
    return res.status(400).json({ error: "Reação inválida." });
  }

  const dbData = readDB();
  const post = dbData.posts.find((p: any) => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: "Post não encontrado." });
  }

  if (!post.reactions) {
    post.reactions = { "❤️": [], "🔥": [], "💪": [], "👏": [], "🌟": [] };
  }

  const list = post.reactions[reaction] || [];
  const index = list.indexOf(userId);

  if (index > -1) {
    // Remove reaction
    list.splice(index, 1);
  } else {
    // Add reaction
    list.push(userId);
  }

  post.reactions[reaction] = list;
  writeDB(dbData);
  res.json(post);
});

// Human comment on social feed post
app.post("/api/posts/:postId/comment", (req, res) => {
  const { postId } = req.params;
  const { userId, content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Comentário não pode ser vazio." });
  }

  // Proteção contra injeções de script de XSS e controle de tamanho do comentário de usuário
  if (!userId || userId.length > 128 || hasMalwareOrSuspiciousPatterns(userId)) {
    return res.status(400).json({ error: "Identificador de usuário inválido." });
  }
  if (content.length > 2000 || hasMalwareOrSuspiciousPatterns(content)) {
    return res.status(400).json({ error: "O comentário parece inválido ou excede o limite." });
  }

  const safeContent = sanitizeInput(content);
  const dbData = readDB();
  const post = dbData.posts.find((p: any) => p.id === postId);
  const user = dbData.users.find((u: any) => u.id === userId);

  if (!post) {
    return res.status(404).json({ error: "Post não encontrado." });
  }
  if (!user) {
    return res.status(404).json({ error: "Usuário não cadastrado." });
  }

  const newComment = {
    id: "comment-" + Math.random().toString(36).substr(2, 9),
    userId: user.id,
    userName: user.displayName || user.name,
    userAvatar: user.avatar,
    content: safeContent,
    timestamp: new Date().toISOString(),
    isAI: false
  };

  post.comments.push(newComment);
  writeDB(dbData);
  res.json(post);
});

// Fetch feed posts
app.get("/api/posts", (req, res) => {
  const dbData = readDB();
  res.json(dbData.posts);
});

// Goals endpoints
app.post("/api/goals", (req, res) => {
  const { userId, title, description, deadline } = req.body;

  // Proteção contra scripts de injeção e limites de strings em metas/objetivos
  if (!userId || userId.length > 128 || hasMalwareOrSuspiciousPatterns(userId)) {
    return res.status(400).json({ error: "Identificador de usuário inválido." });
  }
  if (!title || title.length > 150 || hasMalwareOrSuspiciousPatterns(title)) {
    return res.status(400).json({ error: "Título inválido ou muito longo." });
  }
  if (description && (description.length > 1000 || hasMalwareOrSuspiciousPatterns(description))) {
    return res.status(400).json({ error: "Descrição parece inválida ou excede o limite." });
  }

  const safeTitle = sanitizeInput(title);
  const safeDescription = sanitizeInput(description);
  const safeDeadline = sanitizeInput(deadline);

  const dbData = readDB();

  const newGoal = {
    id: "goal-" + Math.random().toString(36).substr(2, 9),
    userId,
    title: safeTitle,
    description: safeDescription,
    deadline: safeDeadline || "Sem prazo",
    progress: 0,
    createdAt: new Date().toISOString()
  };

  dbData.goals.push(newGoal);
  writeDB(dbData);
  res.json(newGoal);
});

app.post("/api/goals/:goalId/progress", (req, res) => {
  const { goalId } = req.params;
  const { progress } = req.body;

  const dbData = readDB();
  const goal = dbData.goals.find((g: any) => g.id === goalId);

  if (!goal) {
    return res.status(404).json({ error: "Objetivo não encontrado." });
  }

  goal.progress = Math.min(100, Math.max(0, Number(progress)));
  writeDB(dbData);
  res.json(goal);
});

app.delete("/api/goals/:goalId", (req, res) => {
  const { goalId } = req.params;
  const dbData = readDB();
  
  dbData.goals = dbData.goals.filter((g: any) => g.id !== goalId);
  writeDB(dbData);
  res.json({ success: true });
});

// Communities endpoints
app.get("/api/communities", (req, res) => {
  const dbData = readDB();
  res.json(dbData.communities);
});

app.post("/api/communities", (req, res) => {
  const { userId, name, description, rules, enabledActivities, cover, startDate, endDate, prize, privacy, customSubgroups } = req.body;
  const dbData = readDB();

  const newComm = {
    id: "comm-" + Math.random().toString(36).substr(2, 9),
    name,
    description,
    rules: rules || "Respeito e incentivo mútuo.",
    creatorId: userId,
    enabledActivities: enabledActivities || ["gongyo", "daimoku", "exercise"],
    membersCount: 1,
    cover: cover || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800",
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    prize: prize || "Reconhecimento da comunidade",
    privacy: privacy || "public",
    customSubgroups: Array.isArray(customSubgroups) ? customSubgroups : [],
    participants: [userId]
  };

  dbData.communities.push(newComm);
  writeDB(dbData);
  res.json(newComm);
});

app.post("/api/communities/:id/join", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!id || !userId) {
    return res.status(400).json({ error: "Parâmetros id e userId são obrigatórios." });
  }

  const dbData = readDB();
  const index = dbData.communities.findIndex((c: any) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Desafio não encontrado." });
  }

  const comm = dbData.communities[index];
  if (!comm.participants) {
    comm.participants = [];
  }
  if (!comm.participants.includes(userId)) {
    comm.participants.push(userId);
  }
  comm.membersCount = comm.participants.length;

  dbData.communities[index] = comm;
  writeDB(dbData);
  res.json({ success: true, community: comm });
});

app.post("/api/communities/:id/leave", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!id || !userId) {
    return res.status(400).json({ error: "Parâmetros id e userId são obrigatórios." });
  }

  const dbData = readDB();
  const index = dbData.communities.findIndex((c: any) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Desafio não encontrado." });
  }

  const comm = dbData.communities[index];
  if (!comm.participants) {
    comm.participants = [];
  }
  comm.participants = comm.participants.filter((uid: string) => uid !== userId);
  comm.membersCount = comm.participants.length;

  dbData.communities[index] = comm;
  writeDB(dbData);
  res.json({ success: true, community: comm });
});

// Community Notices / Mural de Avisos endpoints
app.get("/api/notices", (req: any, res: any) => {
  const dbData = readDB();
  if (!dbData.notices) {
    dbData.notices = [];
  }
  res.json(dbData.notices);
});

// Helper validation middleware/check for notices leadership roles
async function extractAndVerifyLeader(req: any) {
  if (!req.idToken || !firebaseConfig) return null;
  try {
    const payload = await verifyFirebaseToken(req.idToken, firebaseConfig.projectId);
    if (!payload) return null;
    const dbData = readDB();
    const user = dbData.users.find((u: any) => u.id === payload.sub);
    if (user && (hasRole(user, ["admin", "leader", "district_leader", "regional_leader", "community_admin"]) || user.isAdmin === true)) {
      return user;
    }
  } catch (err) {
    console.error("[AUTH_CHECK_NOTICE] Token validation failed:", err);
  }
  return null;
}

app.post("/api/notices", async (req: any, res: any) => {
  const { type, tag, title, description, deadline, target, maxProgress, color } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "Título e descrição são obrigatórios." });
  }

  const leaderUser = await extractAndVerifyLeader(req);
  if (!leaderUser) {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores e líderes autorizados podem postar no Mural de Avisos." });
  }

  const dbData = readDB();
  if (!dbData.notices) {
    dbData.notices = [];
  }

  const newNotice = {
    id: `notice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: type || "announcement",
    tag: tag || "📢 Aviso",
    title: String(title).trim(),
    description: String(description).trim(),
    deadline: deadline || "",
    target: target || "Todos os participantes.",
    currentProgress: 0,
    maxProgress: maxProgress ? Number(maxProgress) : null,
    color: color || "from-slate-900/40 to-slate-950/40 border-slate-800 text-slate-350",
    joinedCount: 0,
    participants: []
  };

  dbData.notices.push(newNotice);
  writeDB(dbData);
  persistDoc("notices", newNotice.id, newNotice);
  res.json(newNotice);
});

app.post("/api/notices/update", async (req: any, res: any) => {
  const { id, type, tag, title, description, deadline, target, maxProgress, currentProgress, color } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID do aviso é necessário." });
  }

  const leaderUser = await extractAndVerifyLeader(req);
  if (!leaderUser) {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores e líderes autorizados podem editar os avisos." });
  }

  const dbData = readDB();
  if (!dbData.notices) dbData.notices = [];

  const index = dbData.notices.findIndex((n: any) => n.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Aviso não encontrado." });
  }

  const existing = dbData.notices[index];
  const updatedNotice = {
    ...existing,
    type: type || existing.type,
    tag: tag || existing.tag,
    title: title !== undefined ? String(title).trim() : existing.title,
    description: description !== undefined ? String(description).trim() : existing.description,
    deadline: deadline !== undefined ? deadline : existing.deadline,
    target: target !== undefined ? target : existing.target,
    currentProgress: currentProgress !== undefined ? Number(currentProgress) : existing.currentProgress,
    maxProgress: maxProgress !== undefined ? (maxProgress ? Number(maxProgress) : null) : existing.maxProgress,
    color: color || existing.color
  };

  dbData.notices[index] = updatedNotice;
  writeDB(dbData);
  persistDoc("notices", id, updatedNotice, req.idToken, { isUpdate: true });
  res.json(updatedNotice);
});

app.delete("/api/notices/:id", async (req: any, res: any) => {
  const { id } = req.params;

  const leaderUser = await extractAndVerifyLeader(req);
  if (!leaderUser) {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores e líderes autorizados podem remover avisos do Mural." });
  }

  const dbData = readDB();
  if (!dbData.notices) dbData.notices = [];

  const index = dbData.notices.findIndex((n: any) => n.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Aviso não encontrado." });
  }

  dbData.notices.splice(index, 1);
  writeDB(dbData);
  removeDoc("notices", id);
  res.json({ success: true });
});

app.post("/api/notices/join", (req: any, res: any) => {
  const { id, userId } = req.body;
  if (!id || !userId) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  const dbData = readDB();
  if (!dbData.notices) dbData.notices = [];

  const index = dbData.notices.findIndex((n: any) => n.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Aviso não encontrado." });
  }

  const notice = dbData.notices[index];
  if (!notice.participants) notice.participants = [];

  const uIndex = notice.participants.indexOf(userId);
  if (uIndex === -1) {
    notice.participants.push(userId);
    notice.joinedCount = notice.participants.length;
    if (notice.maxProgress && notice.currentProgress < notice.maxProgress) {
      notice.currentProgress = (notice.currentProgress || 0) + 1;
    }
  } else {
    notice.participants.splice(uIndex, 1);
    notice.joinedCount = notice.participants.length;
    if (notice.maxProgress && notice.currentProgress > 0) {
      notice.currentProgress = (notice.currentProgress || 0) - 1;
    }
  }

  dbData.notices[index] = notice;
  writeDB(dbData);
  persistDoc("notices", id, notice, req.idToken, { isUpdate: true });
  res.json(notice);
});

// MuseumOfTheJourney Memories Firestore endpoints
app.get("/api/memories", async (req: any, res: any) => {
  const dbData = readDB();
  if (!dbData.memories) {
    dbData.memories = [];
  }

  // If token is validated, return list scoped to user. If not, fallback to req.query.userId or return empty
  let targetUserId = "";
  if (req.idToken && firebaseConfig) {
    try {
      const payload = await verifyFirebaseToken(req.idToken, firebaseConfig.projectId);
      if (payload) {
        targetUserId = payload.sub;
      }
    } catch (e) {
      // invalid token
    }
  }
  
  if (!targetUserId) {
    targetUserId = (req.query.userId as string) || "";
  }

  if (!targetUserId) {
    return res.json([]);
  }

  const userMemories = dbData.memories.filter((m: any) => m.userId === targetUserId);
  res.json(userMemories);
});

app.post("/api/memories", async (req: any, res: any) => {
  const { url, caption, tag, date } = req.body;
  if (!url) {
    return res.status(400).json({ error: "A URL da foto é obrigatória." });
  }

  let authenticatedUserId = "";
  if (req.idToken && firebaseConfig) {
    try {
      const payload = await verifyFirebaseToken(req.idToken, firebaseConfig.projectId);
      if (payload) {
        authenticatedUserId = payload.sub;
      }
    } catch (e) {
      return res.status(401).json({ error: "Sua autenticação falhou." });
    }
  }

  if (!authenticatedUserId) {
    authenticatedUserId = (req.body.userId as string) || "";
  }

  if (!authenticatedUserId) {
    return res.status(401).json({ error: "Usuário não autenticado." });
  }

  const dbData = readDB();
  if (!dbData.memories) {
    dbData.memories = [];
  }

  const newMemory = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: authenticatedUserId,
    url,
    caption: String(caption || "Memória da Jornada").trim(),
    tag: String(tag || "Geral").trim(),
    date: date || new Date().toISOString().split("T")[0]
  };

  dbData.memories.push(newMemory);
  writeDB(dbData);
  persistDoc("memories", newMemory.id, newMemory);
  res.json(newMemory);
});

app.delete("/api/memories/:id", async (req: any, res: any) => {
  const { id } = req.params;

  let authenticatedUserId = "";
  if (req.idToken && firebaseConfig) {
    try {
      const payload = await verifyFirebaseToken(req.idToken, firebaseConfig.projectId);
      if (payload) {
        authenticatedUserId = payload.sub;
      }
    } catch (e) {
      return res.status(401).json({ error: "Autenticação falhou." });
    }
  }

  const dbData = readDB();
  if (!dbData.memories) dbData.memories = [];

  const index = dbData.memories.findIndex((m: any) => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Memória não localizada." });
  }

  const memory = dbData.memories[index];
  
  // Guard check: enforce only the memory creator can delete it
  if (authenticatedUserId && memory.userId !== authenticatedUserId) {
    return res.status(403).json({ error: "Prezado praticante, você não tem autorização para remover memórias de terceiros." });
  }

  dbData.memories.splice(index, 1);
  writeDB(dbData);
  removeDoc("memories", id);
  res.json({ success: true });
});

// Group and Challenge Chat messages endpoints
app.get("/api/chats/:communityId", (req, res) => {
  const { communityId } = req.params;
  const dbData = readDB();
  const messages = (dbData.chats || []).filter((c: any) => c.communityId === communityId);
  res.json(messages);
});

app.post("/api/chats", (req, res) => {
  const { communityId, message } = req.body;
  if (!communityId || !message) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  const dbData = readDB();
  if (!dbData.chats) {
    dbData.chats = [];
  }

  const chatMsg = {
    ...message,
    id: message.id || `chat-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    communityId,
    timestamp: message.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    reactions: message.reactions || {},
    isPinned: message.isPinned || false
  };

  dbData.chats.push(chatMsg);
  writeDB(dbData);
  persistDoc("chats", chatMsg.id, chatMsg);
  res.json(chatMsg);
});

app.post("/api/chats/:msgId/toggle-pin", (req, res) => {
  const { msgId } = req.params;
  const dbData = readDB();
  if (!dbData.chats) dbData.chats = [];

  const msg = dbData.chats.find((c: any) => c.id === msgId);
  if (!msg) {
    return res.status(404).json({ error: "Mensagem não encontrada." });
  }

  msg.isPinned = !msg.isPinned;
  writeDB(dbData);
  persistDoc("chats", msgId, msg, (req as any).idToken, { isUpdate: true });
  res.json(msg);
});

app.post("/api/chats/:msgId/react", (req, res) => {
  const { msgId } = req.params;
  const { emoji } = req.body;
  const dbData = readDB();
  if (!dbData.chats) dbData.chats = [];

  const msg = dbData.chats.find((c: any) => c.id === msgId);
  if (!msg) {
    return res.status(404).json({ error: "Mensagem não encontrada." });
  }

  if (!msg.reactions) msg.reactions = {};
  msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;

  writeDB(dbData);
  persistDoc("chats", msgId, msg, (req as any).idToken, { isUpdate: true });
  res.json(msg);
});

// Update Kofu STATUS
app.post("/api/kofu", (req, res) => {
  const { userId, campaignId, status } = req.body;
  const dbData = readDB();

  let kofuRecord = dbData.kofu.find((k: any) => k.userId === userId && k.campaignId === campaignId);
  if (!kofuRecord) {
    kofuRecord = { userId, campaignId, status, updatedAt: new Date().toISOString() };
    dbData.kofu.push(kofuRecord);
  } else {
    kofuRecord.status = status;
    kofuRecord.updatedAt = new Date().toISOString();
  }

  writeDB(dbData);
  res.json(kofuRecord);
});

// Update BS subscription status
app.post("/api/bs", (req, res) => {
  const { userId, status, renewalDate } = req.body;
  const dbData = readDB();

  let bsRecord = dbData.bs_subscription.find((b: any) => b.userId === userId);
  if (!bsRecord) {
    bsRecord = { userId, status, renewalDate: renewalDate || "", currentStreakMonths: status === "ativo" ? 1 : 0 };
    dbData.bs_subscription.push(bsRecord);
  } else {
    bsRecord.status = status;
    if (renewalDate !== undefined) bsRecord.renewalDate = renewalDate;
    if (status === "ativo" && bsRecord.currentStreakMonths === 0) {
      bsRecord.currentStreakMonths = 1;
    }
    writeDB(dbData);
  }

  res.json(bsRecord);
});

// Gets collective testing trial status - BodhiShape is 100% free, so we return deactivated trial flags
app.get("/api/trial-status", (req, res) => {
  res.json({
    trialActive: false,
    daysRemaining: 9999,
    trialEndDate: ""
  });
});

// A1 Personalized AI Encouragement Quote generator using server-side Gemini
app.get("/api/ai-incentive", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "userId é obrigatório" });
  }

  const dbData = readDB();
  const user = dbData.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  let quote = "";

  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        Gere uma pequena mensagem personalizada de incentivo espiritual e físico para o usuário "${user.displayName || user.name}".
        Ele é da divisão "${user.division}" da BSGI e reside em "${user.city}/${user.state}".
        Ele está com uma sequência ativa (streak) de ${user.streak || 1} dias consecutivos!
        A mensagem deve ter no máximo 2 frases curtas, focar na superação diária através do Daimoku (determinação mental) e do Shape (disciplina corporal).
        Use o tom clássico e amigável dos veteranos da BSGI. NÃO inclua aspas, títulos ou markdown.
      `;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      quote = response.text?.trim() || "";
    } catch (e) {
      console.error("Erro ao gerar incentivo da IA:", e);
    }
  }

  if (!quote) {
    const fallbacks = [
      `Daimoku com determinação gera a força real que nenhum treino pesado consegue explicar. Continue firme com sua sequência de ${user.streak || 1} dias, ${user.displayName || "Bodhishaper"}!`,
      `Vitória hoje, vitória amanhã! Lapidar o espírito pelo Daimoku matinal prepara o corpo para vencer qualquer limite físico. Avante!`,
      `Suando o carma e lapidando o espírito! Cada passo na corrida e minuto de recitação constroem uma existência feliz e inabalável.`
    ];
    quote = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  res.json({ quote });
});

// REMINDERS & AGENDA REST ENDPOINTS
app.get("/api/reminders", async (req: any, res) => {
  const { userId } = req.query;
  
  if (req.idToken && userId) {
    await syncUserFromFirestore(userId as string, req.idToken);
  }

  const dbData = readDB();
  if (!dbData.reminders) dbData.reminders = [];
  
  if (userId) {
    const userReminders = dbData.reminders.filter((r: any) => r.userId === userId);
    return res.json(userReminders);
  }
  res.json(dbData.reminders);
});

app.post("/api/reminders", (req: any, res) => {
  const { userId, title, date, category, description } = req.body;
  if (!userId || !title || !date || !category) {
    return res.status(400).json({ error: "Parâmetros obrigatórios ausentes (userId, title, date, category)." });
  }

  // Security validators (complying with secure guidelines)
  if (userId.length > 128 || hasMalwareOrSuspiciousPatterns(userId)) {
    return res.status(400).json({ error: "Identificador de usuário inválido." });
  }
  if (title.length > 150 || hasMalwareOrSuspiciousPatterns(title)) {
    return res.status(400).json({ error: "Título excede os limites de segurança." });
  }
  if (description && (description.length > 1000 || hasMalwareOrSuspiciousPatterns(description))) {
    return res.status(400).json({ error: "Descrição excede limite de tamanho." });
  }

  const safeTitle = sanitizeInput(title);
  const safeDate = sanitizeInput(date);
  const safeCategory = sanitizeInput(category);
  const safeDescription = description ? sanitizeInput(description) : "";

  const dbData = readDB();
  if (!dbData.reminders) dbData.reminders = [];

  const newReminder = {
    id: "reminder-" + crypto.randomUUID().substring(0, 8),
    userId,
    title: safeTitle,
    date: safeDate,
    category: safeCategory,
    description: safeDescription,
    createdAt: new Date().toISOString()
  };

  dbData.reminders.push(newReminder);
  writeDB(dbData, req.idToken);
  persistDoc("reminders", newReminder.id, newReminder, req.idToken);

  res.status(201).json(newReminder);
});

app.delete("/api/reminders/:id", (req: any, res) => {
  const { id } = req.params;
  const dbData = readDB();
  if (!dbData.reminders) dbData.reminders = [];

  const index = dbData.reminders.findIndex((r: any) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Lembrete não encontrado na agenda." });
  }

  dbData.reminders.splice(index, 1);
  writeDB(dbData, req.idToken);
  removeDoc("reminders", id, req.idToken);

  res.json({ success: true, message: "Lembrete removido com sucesso." });
});

// Real-time Active Daimoku Practitioners (Multi-instance Scalable Integration)
app.post("/api/daimoku/start", async (req, res) => {
  const { userId, name } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }
  try {
    const docRef = doc(db, "active_practitioners", userId);
    await setDoc(docRef, {
      userId,
      name: name || "BodhiShaper",
      lastHeartbeat: Date.now()
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error setting active practitioner:", err);
    res.json({ success: true, warning: "Fallback state active" });
  }
});

app.post("/api/daimoku/heartbeat", async (req, res) => {
  const { userId, name } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }
  try {
    const docRef = doc(db, "active_practitioners", userId);
    await setDoc(docRef, {
      userId,
      name: name || "BodhiShaper",
      lastHeartbeat: Date.now()
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error setting active practitioner heartbeat:", err);
    res.json({ success: true });
  }
});

app.post("/api/daimoku/stop", async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }
  try {
    const docRef = doc(db, "active_practitioners", userId);
    await deleteDoc(docRef);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting active practitioner:", err);
    res.json({ success: true });
  }
});

app.get("/api/daimoku/active", async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, "active_practitioners"));
    const list: any[] = [];
    const now = Date.now();
    snapshot.forEach((d) => {
      const data = d.data();
      // Omit stale heartbeats (idle for more than 90 seconds)
      if (data && data.lastHeartbeat && (now - data.lastHeartbeat <= 90000)) {
        list.push({
          userId: data.userId,
          name: data.name
        });
      }
    });
    res.json(list);
  } catch (err: any) {
    console.error("Error fetching active practitioners:", err);
    res.json([]);
  }
});

// --- FEEDBACKS ENDPOINTS ---
app.post("/api/feedbacks", async (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ error: "userId e mensagem são obrigatórios." });
  }

  const dbData = readDB();
  const user = dbData.users.find((u: any) => u.id === userId);
  const userName = user ? (user.displayName || user.name) : "Usuário Anônimo";
  const userEmail = user ? user.email : "";

  const newFeedback = {
    id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    userName,
    userEmail,
    message: sanitizeInput(message),
    timestamp: new Date().toISOString()
  };

  if (!dbData.feedbacks) dbData.feedbacks = [];
  dbData.feedbacks.push(newFeedback);
  
  writeDB(dbData, (req as any).idToken);
  res.json({ success: true, feedback: newFeedback });
});

app.get("/api/feedbacks", async (req, res) => {
  const { userId } = req.query;
  const dbData = readDB();
  const user = dbData.users.find((u: any) => u.id === (userId as string));
  
  if (!user || !hasRole(user, "admin")) {
    return res.status(403).json({ error: "Apenas administradores podem ler os feedbacks." });
  }

  res.json(dbData.feedbacks || []);
});


// --- LIVES ENDPOINTS ---
app.get("/api/lives", async (req, res) => {
  const dbData = readDB();
  res.json(dbData.lives || []);
});

app.post("/api/lives", async (req, res) => {
  const { userId, title, description, videoUrl } = req.body;
  const dbData = readDB();
  const user = dbData.users.find((u: any) => u.id === userId);

  if (!user || !hasRole(user, "admin")) {
    return res.status(403).json({ error: "Apenas administradores podem iniciar uma transmissão." });
  }

  if (!title || !videoUrl) {
    return res.status(400).json({ error: "Título e URL do vídeo são obrigatórios." });
  }

  // Extract Youtube Video ID if it's a full URL
  let parsedVideoUrl = videoUrl;
  const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch) {
    parsedVideoUrl = ytMatch[1];
  }

  const newLive = {
    id: `live-${Date.now()}`,
    title: sanitizeInput(title),
    description: sanitizeInput(description || ""),
    videoUrl: parsedVideoUrl,
    createdAt: new Date().toISOString(),
    createdBy: userId,
    likes: 0
  };

  dbData.lives = [newLive]; // Only allow one active live at a time
  dbData.live_comments = []; // Reset live chat for the new session
  
  writeDB(dbData, (req as any).idToken);
  res.json(newLive);
});

app.delete("/api/lives/:liveId", async (req, res) => {
  const { liveId } = req.params;
  const { userId } = req.query;

  const dbData = readDB();
  const user = dbData.users.find((u: any) => u.id === (userId as string));

  if (!user || !hasRole(user, "admin")) {
    return res.status(403).json({ error: "Apenas administradores podem encerrar transmissões." });
  }

  dbData.lives = (dbData.lives || []).filter((l: any) => l.id !== liveId);
  dbData.live_comments = []; // Clean up comments
  
  writeDB(dbData, (req as any).idToken);
  res.json({ success: true });
});

app.post("/api/lives/:liveId/react", async (req, res) => {
  const { liveId } = req.params;
  const dbData = readDB();
  const live = (dbData.lives || []).find((l: any) => l.id === liveId);
  if (live) {
    live.likes = (live.likes || 0) + 1;
    writeDB(dbData, (req as any).idToken);
    return res.json({ success: true, likes: live.likes });
  }
  res.status(404).json({ error: "Transmissão não encontrada" });
});

app.get("/api/lives/:liveId/comments", async (req, res) => {
  const { liveId } = req.params;
  const dbData = readDB();
  const comments = (dbData.live_comments || []).filter((c: any) => c.liveId === liveId);
  res.json(comments);
});

app.post("/api/lives/:liveId/comments", async (req, res) => {
  const { liveId } = req.params;
  const { userId, content } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: "userId e conteúdo são obrigatórios." });
  }

  const dbData = readDB();
  const user = dbData.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  const newComment = {
    id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    liveId,
    userId,
    userName: user.displayName || user.name,
    userAvatar: user.avatar,
    content: sanitizeInput(content),
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    badge: hasRole(user, "admin") ? "Staff" : undefined
  };

  if (!dbData.live_comments) dbData.live_comments = [];
  dbData.live_comments.push(newComment);

  writeDB(dbData, (req as any).idToken);
  res.json(newComment);
});

// Serving web static frontend assets or implementing Vite dev server
async function setupViteServerOrProd() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: 0,
      setHeaders: (res, path) => {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BODHISATTVAS DO SHAPE] Server is up on http://localhost:${PORT}`);
  });
}

// Core Bootstrap entry point to enforce sequence on startup
async function bootstrap() {
  console.log("[BOOTSTRAP] Commencing BodhiShape production server initialization...");

  // 1. Ensure local data directory and file exists initially as baseline
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      dbData = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      console.log("[BOOTSTRAP] Loaded baseline state from local JSON Cache.");
    } catch (e: any) {
      console.error("[BOOTSTRAP] Local cash JSON syntax corrupt, using seed defaults:", e.message);
      dbData = { ...initialData };
    }
  } else {
    dbData = { ...initialData };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
    console.log("[BOOTSTRAP] Created fresh database.json with seed data.");
  }

  // 2. Initialize Firebase and authenticate server connection safely
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const firebaseApp = initializeApp(firebaseConfig);
      db = initializeFirestore(firebaseApp, {
        experimentalAutoDetectLongPolling: true,
      }, firebaseConfig.firestoreDatabaseId || "(default)");
      console.log("[FIREBASE] FireStore Client connection established in project:", firebaseConfig.projectId);
    } else {
      console.warn("[FIREBASE] firebase-applet-config.json not found on disk. Offline mode activated.");
    }
  } catch (err: any) {
    console.error("[FIREBASE] Connection initialization aborted:", err.message);
  }

  // 3. Sync memory state with Firestore safely (now rule privileged!)
  await seedAndLoadFromFirestore();

  // 4. Initialize Express & Vite server
  await setupViteServerOrProd();
}

bootstrap().catch(err => {
  console.error("[CRITICAL SYSTEM FAULT] Server failed to bootstrap:", err);
});
