from celery_server import send_email_task

# Define email details
sender_email = "support@merimedevelopment.co.ke"
recipient_email = "michaelmachohi@gmail.com"
subject = "Test Email from Celery"
template_name = "otp_email.html"  # Make sure this template exists in TEMPLATE_DIR
context = {"otp": "32"}

# Trigger the email task
send_email_task.apply_async(args=[sender_email, recipient_email, subject, template_name, context])
