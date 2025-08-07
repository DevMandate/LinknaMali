import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# SMTP Configuration
SMTP_SERVER = "mail.merimedevelopment.co.ke"
SMTP_PORT = 587
SENDER_EMAIL = "support@merimedevelopment.co.ke"
SENDER_PASSWORD = "M4r1meDvSup0"
RECEIVER_EMAIL = "michaelmachohi@gmail.com"

# Email Content
subject = "Test Email from Python"
body = """
<html>
    <body>
        <h2>Hello,</h2>
        <p>This is a test email sent using Python.</p>
        <p>If you received this, SMTP is working.</p>
    </body>
</html>
"""

try:
    # Set up the email
    msg = MIMEMultipart()
    msg["From"] = SENDER_EMAIL
    msg["To"] = RECEIVER_EMAIL
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    # Connect to SMTP Server
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()  # Upgrade connection to secure TLS
        server.login(SENDER_EMAIL, SENDER_PASSWORD)  # Authenticate
        server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, msg.as_string())  # Send email

    print("Email sent successfully!")

except smtplib.SMTPAuthenticationError:
    print("SMTP Authentication Error: Check email and password.")

except smtplib.SMTPConnectError:
    print("SMTP Connection Error: Unable to connect to the server.")

except smtplib.SMTPException as e:
    print(f"SMTP Error: {e}")

except Exception as e:
    print(f"General Error: {e}")
