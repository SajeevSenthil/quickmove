"""
Direct SMTP email sender — no n8n required.
Uses Python's built-in smtplib with Gmail TLS.
"""
import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings


def _build_assignment_email(customer: dict, broker: dict, assignment: dict) -> str:
    budget_str = "Not specified"
    if customer.get("budget_min") and customer.get("budget_max"):
        budget_str = (
            f"Rs.{customer['budget_min']:,} - Rs.{customer['budget_max']:,} / month"
        )
    elif customer.get("budget_max"):
        budget_str = f"Up to Rs.{customer['budget_max']:,} / month"

    regions = ", ".join(customer.get("preferred_regions") or []) or "Not specified"
    specials = customer.get("special_requirements") or []
    specials_text = "\n".join(f"  - {s}" for s in specials) if specials else "  None"

    return f"""Dear {broker['name']},

You have been assigned a new property search request through QuickMove.
Please review the customer requirements below and begin shortlisting.

─────────────────────────────────────────
CUSTOMER DETAILS
─────────────────────────────────────────
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

─────────────────────────────────────────
ASSIGNMENT DETAILS
─────────────────────────────────────────
Assignment ID   : #{assignment['id']}
Assigned By     : {assignment.get('approved_by') or 'Operations Team'}
Respond By      : {assignment.get('deadline') or 'As soon as possible'}

─────────────────────────────────────────

Next Steps:
1. Begin property search in the specified localities
2. Shortlist 3-5 properties matching the criteria
3. Share the shortlist with QuickMove within the deadline
4. Coordinate site visits with the customer

For questions, contact the QuickMove operations team.

Best regards,
QuickMove Operations
ops@quickmove.in
"""


def _build_message(to_email: str, subject: str, body: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(body, "plain"))
    return msg


def _send_smtp(to_email: str, subject: str, body: str) -> bool:
    """
    Tries SSL (port 465) first, then STARTTLS (port 587) as fallback.
    Runs blocking — call via asyncio.to_thread.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return False

    msg = _build_message(to_email, subject, body)
    raw = msg.as_string()
    host = settings.SMTP_HOST

    # Try SSL on 465 first (works even when ISPs block 587)
    try:
        with smtplib.SMTP_SSL(host, 465) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, raw)
        return True
    except Exception:
        pass

    # Fall back to STARTTLS on 587
    with smtplib.SMTP(host, 587) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, raw)
    return True


async def send_broker_assignment_email(
    customer: dict,
    broker: dict,
    assignment: dict,
) -> bool:
    """
    Sends an assignment email to the broker.
    Returns True if sent, False if SMTP not configured or send failed.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return False

    subject = (
        f"New Property Search Assignment - {customer['name']} ({customer['city']})"
    )
    body = _build_assignment_email(customer, broker, assignment)

    try:
        # Run blocking smtplib in a thread so it doesn't block the event loop
        await asyncio.to_thread(_send_smtp, broker["email"], subject, body)
        return True
    except Exception as exc:
        # Log but don't crash — assignment is still valid without email
        print(f"[email] Failed to send to {broker['email']}: {exc}")
        return False
