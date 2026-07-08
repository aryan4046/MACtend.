from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading
import os

# Load .env file explicitly
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# SMTP Configuration - Load from environment or use placeholder fallbacks
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "your-email@gmail.com")
# IMPORTANT: For Gmail, use an "App Password" instead of your actual login password.
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "your-app-password")

def _send_email_thread(to_email, subject, html_content):
    # Skip sending if configuration placeholder is still there
    if SMTP_USER == "your-email@gmail.com" or not SMTP_PASSWORD or SMTP_PASSWORD == "your-app-password":
        print(f"[EMAIL WARNING] SMTP credentials not configured. Skipping sending email to {to_email}.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(html_content, 'html'))
        
        # Connect to SMTP server
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Secure connection
        server.login(SMTP_USER, SMTP_PASSWORD)
        
        # Send
        server.sendmail(SMTP_USER, to_email, msg.as_string())
        server.quit()
        print(f"[EMAIL SUCCESS] Attendance email notification sent successfully to {to_email}")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {to_email}: {e}")

def send_attendance_email(student_email, student_name, subject_name, date_str, time_str, status="PRESENT", faculty_name="Department Faculty"):
    if not student_email:
        print("[EMAIL WARNING] Student does not have a registered email address. Skipping email.")
        return
        
    status = status.upper().strip()
    
    if status == "PRESENT":
        subject = f"MACtend Attendance Alert: {subject_name} ({date_str}) - PRESENT"
        header_bg = "linear-gradient(135deg, #4f46e5, #6366f1)" # indigo
        title_text = "Attendance Marked!"
        intro_text = "This is to notify you that your attendance has been marked for the class session detailed below:"
        badge_bg = "#dcfce7"
        badge_color = "#166534"
        footer_note = "If you believe this has been marked in error or have any questions, please contact your subject faculty directly."
    else:
        subject = f"MACtend Attendance Alert: {subject_name} ({date_str}) - ABSENT"
        header_bg = "linear-gradient(135deg, #e11d48, #f43f5e)" # rose/red
        title_text = "Attendance Alert: Absent"
        intro_text = "This is to notify you that you were marked ABSENT for the class session detailed below:"
        badge_bg = "#ffe4e6"
        badge_color = "#9f1239"
        footer_note = "If you were present but marked absent, please contact your subject faculty immediately to correct your record."

    # Styled HTML Template
    html_content = f"""
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 550px; margin: 20px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05); overflow: hidden;">
            <div style="background: {header_bg}; padding: 24px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">{title_text}</h1>
                <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">MACtend Smart Attendance System</p>
            </div>
            
            <div style="padding: 24px;">
                <p style="margin-top: 0; font-size: 16px;">Dear <strong>{student_name}</strong>,</p>
                <p style="color: #475569; font-size: 15px;">{intro_text}</p>
                
                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-weight: 500; width: 35%;">Subject:</td>
                            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{subject_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Faculty:</td>
                            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{faculty_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Date:</td>
                            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{date_str}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Recorded Time:</td>
                            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{time_str}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Status:</td>
                            <td style="padding: 6px 0;">
                                <span style="background-color: {badge_bg}; color: {badge_color}; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 12px; display: inline-block;">
                                    {status}
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <p style="color: #64748b; font-size: 13px; margin-bottom: 0; line-height: 1.4;">
                    {footer_note}
                </p>
            </div>
            
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
                This is an automated transactional message. Please do not reply directly to this email.
            </div>
        </div>
    </body>
    </html>
    """
    
    # Run email sending in a separate background thread to keep execution synchronous and fast
    thread = threading.Thread(target=_send_email_thread, args=(student_email, subject, html_content))
    thread.start()
