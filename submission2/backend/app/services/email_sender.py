"""
Email sender using Resend (HTTPS API — works on Render free tier).
Render blocks outbound SMTP (port 587), but HTTPS (443) is always open.

Setup: sign up at resend.com → API Keys → copy key → add RESEND_API_KEY to env.
"""
import httpx
from ..config import settings


def _build_assignment_email(customer: dict, broker: dict, assignment: dict) -> str:
    budget_str = "Not specified"
    if customer.get("budget_min") and customer.get("budget_max"):
        budget_str = f"Rs.{customer['budget_min']:,} - Rs.{customer['budget_max']:,} / month"
    elif customer.get("budget_max"):
        budget_str = f"Up to Rs.{customer['budget_max']:,} / month"

    regions = ", ".join(customer.get("preferred_regions") or []) or "Not specified"
    specials = customer.get("special_requirements") or []
    specials_text = "\n".join(f"  - {s}" for s in specials) if specials else "  None"

    return f"""Dear {broker['name']},

You have been assigned a new property search request through QuickMove.
Please review the customer requirements below and begin shortlisting.

-----------------------------------------
CUSTOMER DETAILS
-----------------------------------------
Name            : {customer['name']}
Destination     : {customer['city']}
Apartment Type  : {customer.get('apartment_type') or 'Not specified'}
Budget          : {budget_str}
Furnished       : {customer.get('furnished_status') or 'Not specified'}
Preferred Areas : {regions}
Parking Needed  : {'Yes' if customer.get('parking_required') else 'No'}
Pets Allowed    : {'Yes' if customer.get('pets_allowed') else 'No'}
Office Location : {customer.get('office_location') or 'Not specified'}
Move Date       : {customer.get('move_date') or 'Flexible'}

Special Requirements:
{specials_text}

-----------------------------------------
ASSIGNMENT DETAILS
-----------------------------------------
Assignment ID   : #{assignment['id']}
Assigned By     : {assignment.get('approved_by') or 'Operations Team'}
Respond By      : {assignment.get('deadline') or 'As soon as possible'}

-----------------------------------------

Next Steps:
1. Begin property search in the specified localities
2. Shortlist 3-5 properties matching the criteria
3. Share shortlist with QuickMove within the deadline
4. Coordinate site visits with the customer

For questions, contact ops@quickmove.in

Best regards,
QuickMove Operations
"""


async def send_broker_assignment_email(
    customer: dict,
    broker: dict,
    assignment: dict,
) -> bool:
    """
    Sends assignment email via Resend HTTPS API.
    Falls back to SMTP if RESEND_API_KEY is not set (works locally, blocked on Render free).
    """
    subject = f"New Property Search Assignment - {customer['name']} ({customer['city']})"
    body = _build_assignment_email(customer, broker, assignment)

    if settings.RESEND_API_KEY:
        return await _send_via_resend(broker["email"], subject, body)

    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        return await _send_via_smtp(broker["email"], subject, body)

    print("[email] No provider configured — set RESEND_API_KEY in environment")
    return False


async def _send_via_resend(to_email: str, subject: str, body: str) -> bool:
    # If RESEND_TEST_RECIPIENT is set, override recipient (free tier without domain)
    actual_to = settings.RESEND_TEST_RECIPIENT or to_email
    if actual_to != to_email:
        body = f"[TEST MODE — original recipient: {to_email}]\n\n{body}"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.EMAIL_FROM,
                    "to": [actual_to],
                    "subject": subject,
                    "text": body,
                },
            )
        if response.status_code in (200, 201):
            return True
        print(f"[email] Resend error {response.status_code}: {response.text}")
        return False
    except Exception as exc:
        print(f"[email] Resend exception: {exc}")
        return False


async def _send_via_smtp(to_email: str, subject: str, body: str) -> bool:
    import smtplib
    import asyncio
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    def _blocking_send():
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_USER
        msg["To"] = to_email
        msg.attach(MIMEText(body, "plain"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

    try:
        await asyncio.to_thread(_blocking_send)
        return True
    except Exception as exc:
        print(f"[email] SMTP error: {exc}")
        return False
