
import logging
import sys
import os

# Ensure we can import from app
sys.path.append(os.getcwd())

from app.utils import send_email
from app.core.config import settings

# Configure logging to see output
logging.basicConfig(level=logging.INFO)

print("Testing send_email function from app.utils...")
print(f" sending to: {settings.SMTP_USER}")

try:
    send_email(
        email_to=settings.SMTP_USER,
        subject="Verification Email - Fix works!",
        html_content="<p>This email confirms that the new smtplib implementation in <b>app.utils</b> is working correctly.</p>"
    )
    print("Test completed. Check logs for success message.")
except Exception as e:
    print(f"Test FAILED with exception: {e}")
    sys.exit(1)
