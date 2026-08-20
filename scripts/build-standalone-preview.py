"""Build one HTML file for offline content review.

The preview uses local fallback mode. It is not a replacement for the Supabase-backed
multi-device deployment.
"""

from __future__ import annotations

import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Search_Everywhere_Lab_Standalone_Preview.html"

html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "assets/styles.css").read_text(encoding="utf-8")
data = (ROOT / "assets/data.js").read_text(encoding="utf-8")
realtime = (ROOT / "assets/realtime.js").read_text(encoding="utf-8")
app = (ROOT / "assets/app.js").read_text(encoding="utf-8")
operating_model = (ROOT / "assets/search-everywhere-operating-model.svg").read_bytes()
favicon = (ROOT / "assets/favicon.svg").read_bytes()

html = re.sub(r'<link rel="manifest"[^>]+>\s*', "", html)
html = re.sub(r'<link rel="icon"[^>]+>\s*', "", html)
html = re.sub(r'<link rel="stylesheet"[^>]+>\s*', "", html)
html = re.sub(r'<script src="\.\/assets\/config\.js"></script>\s*', "", html)
html = re.sub(r'<script type="module" src="\.\/assets\/app\.js(?:\?[^"]*)?"></script>\s*', "", html)
html = re.sub(r'<meta property="og:image"[^>]+>\s*', "", html)

favicon_data = base64.b64encode(favicon).decode("ascii")
html = html.replace("</head>", f'<link rel="icon" href="data:image/svg+xml;base64,{favicon_data}">\n<style>{css}</style>\n</head>')

data = re.sub(r"^export const ", "const ", data, flags=re.M)
keys = [
    "STAGES", "JOURNEY_STAGES", "COGNITIVE_STATES", "COGNITIVE_SCENARIOS",
    "KNOWLEDGE_CHECKS", "WHEEL_CHALLENGES", "PLATFORMS", "SIGNALS", "CLIENTS",
    "SHOCKS", "OBJECTIONS", "HUMAN_SIGNALS", "SAMPLE_JOURNEYS",
    "SEED_AUDIT_ROWS", "SOURCES",
]
data_bundle = "(function(){\n" + data + "\nwindow.__SE_DATA={" + ",".join(keys) + "};\n})();"

realtime = realtime.replace(
    "export const realtime = new WorkshopRealtime();\nexport { createCode, normalizeCode, randomId };",
    "const realtime = new WorkshopRealtime();\nreturn { realtime, createCode, normalizeCode, randomId };",
)
realtime_bundle = "window.__SE_RT=(function(){\n" + realtime + "\n})();"

app = re.sub(r"import \{[\s\S]*?\} from './data\.js';\n", "", app, count=1)
app = re.sub(r"import \{ realtime, randomId, normalizeCode \} from './realtime\.js';\n", "", app, count=1)
operating_model_data = base64.b64encode(operating_model).decode("ascii")
app = app.replace(
    "./assets/search-everywhere-operating-model.svg",
    f"data:image/svg+xml;base64,{operating_model_data}",
)
app = app.replace(
    "if(!new URLSearchParams(location.search).has('preview'))setTimeout(()=>openDialog(joinDialog),120);",
    "// Offline preview opens directly. Use the GitHub Pages deployment for live rooms.",
)
app = (
    "const {STAGES,JOURNEY_STAGES,COGNITIVE_STATES,COGNITIVE_SCENARIOS,KNOWLEDGE_CHECKS,"
    "WHEEL_CHALLENGES,PLATFORMS,SIGNALS,CLIENTS,SHOCKS,OBJECTIONS,HUMAN_SIGNALS,"
    "SAMPLE_JOURNEYS,SEED_AUDIT_ROWS,SOURCES}=window.__SE_DATA;\n"
    "const {realtime,randomId,normalizeCode}=window.__SE_RT;\n" + app
)

bundle = (
    "window.SE_CONFIG={supabaseUrl:'',supabaseAnonKey:'',enableDemoFallback:true,"
    "appName:'Lamark Search Everywhere Experience Lab',defaultStageSeconds:480,maxParticipants:12,debug:false};\n"
    + data_bundle + "\n" + realtime_bundle + "\n" + app
)
bundle = bundle.replace("</script", "<\\/script")
html = html.replace("</body>", f"<script>{bundle}</script>\n</body>")
OUTPUT.write_text(html, encoding="utf-8")
print(f"Built {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")
