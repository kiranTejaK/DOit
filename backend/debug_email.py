
import os
import sys
import smtplib
import traceback

# Basic .env parser
def load_env(path):
    print(f"Loading env from {path}")
    if not os.path.exists(path):
        print(f"Env file not found at {path}")
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

# Load .env
possible_env_paths = [
    os.path.join(os.getcwd(), 'backend', '.env'),
    os.path.join(os.getcwd(), '.env'),
    os.path.join(os.getcwd(), '..', '.env'),
]

loaded = False
for p in possible_env_paths:
    if os.path.exists(p):
        load_env(p)
        loaded = True
        break

if not loaded:
    print("WARNING: No .env file found.")

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_TLS = os.getenv("SMTP_TLS", "True").lower() == "true"
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAILS_FROM_EMAIL = os.getenv("EMAILS_FROM_EMAIL") or SMTP_USER

print(f"Config: Host={SMTP_HOST}, Port={SMTP_PORT}, User={SMTP_USER}, TLS={SMTP_TLS}")

if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
    print("Error: Missing SMTP configuration in .env")
    sys.exit(1)

try:
    print(f"Connecting to {SMTP_HOST}:{SMTP_PORT}...")
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
    server.set_debuglevel(1)
    
    if SMTP_TLS:
        print("Starting TLS...")
        server.starttls()
    
    print("Logging in...")
    server.login(SMTP_USER, SMTP_PASSWORD)
    
    msg = f"Subject: Test Debug Email (smtplib)\n\nThis is a test email sent via smtplib from the debug script.\nConfig: {SMTP_HOST}:{SMTP_PORT}"
    
    print("Sending mail...")
    server.sendmail(EMAILS_FROM_EMAIL, [SMTP_USER], msg)
    
    print("Quitting...")
    server.quit()
    print("SUCCESS: Email sent via smtplib.")
    
except Exception as e:
    print(f"EXCEPTION: {e}")
    traceback.print_exc()
