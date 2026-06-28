import httpx
from ..config import settings


async def trigger_broker_notification(customer: dict, broker: dict, assignment: dict) -> bool:
    """POST to n8n webhook to send broker assignment email and update records."""
    payload = {
        "customer": customer,
        "broker": broker,
        "assignment": assignment,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(settings.N8N_WEBHOOK_URL, json=payload)
            return response.status_code in (200, 201)
    except httpx.RequestError:
        # n8n not available — assignment is still approved, notification pending
        return False
