import json
import re
from typing import List, Dict
from sqlalchemy.orm import Session
from google import genai
from ..models.broker import Broker
from ..models.customer import Customer
from ..config import settings

RECOMMENDATION_PROMPT = """You are a broker allocation AI for QuickMove, a real estate relocation company in India.

Customer Profile:
{customer_json}

Available Brokers (already filtered for city match and capacity):
{brokers_json}

Evaluate each broker and recommend the TOP 3 best matches for this customer.

Scoring criteria (weighted in order):
1. Region/locality coverage — must cover at least one of the customer's preferred regions (highest weight)
2. Budget compatibility — broker's range should overlap with customer's budget
3. Apartment type expertise — broker should list the required apartment type
4. Current workload — lower (current_active_count / capacity_limit) ratio is better
5. Response time — lower avg_response_time_hours is better
6. Broker rating — higher is better

Return a JSON array with exactly 3 objects (or fewer if fewer brokers available):
[
  {{
    "broker_id": <integer>,
    "score": <integer 0-100>,
    "reasoning": "<2-3 sentence explanation of why this broker is a strong match, citing specific data points>"
  }}
]

Order by score descending. Return ONLY valid JSON, no markdown fences, no extra text.
"""

DEMO_RECOMMENDATIONS = [
    {
        "broker_id": 1,
        "score": 96,
        "reasoning": "Ravi Kumar specialises in Whitefield and Marathahalli — exactly the customer's preferred areas — and has strong expertise in 2BHK apartments. His budget range (₹20k–₹45k) aligns well with the ₹25k–₹35k ask, and his low active workload (3/10) with a 4.8 rating makes him the top pick.",
    },
    {
        "broker_id": 5,
        "score": 82,
        "reasoning": "Vikram Menon covers Marathahalli-adjacent areas and handles 2BHK and 3BHK properties. Budget range is compatible and he currently has the lightest workload on the panel (2/8), which means faster turnaround for the customer.",
    },
    {
        "broker_id": 3,
        "score": 74,
        "reasoning": "Suresh Nair operates in premium Bengaluru localities and brings an excellent 4.9 rating with the fastest response time on the panel (3 hrs). While his budget range skews higher, the upper end of the customer's budget is within his wheelhouse.",
    },
]


def filter_brokers_sql(db: Session, customer: Customer) -> List[Broker]:
    """
    Fetch all active brokers with remaining capacity, then filter in Python.
    Matches if broker.city == customer.city  OR  customer.city is listed in
    broker.regions_covered — handles brokers who set their city as a locality.
    """
    candidates = (
        db.query(Broker)
        .filter(
            Broker.is_active == True,
            Broker.current_active_count < Broker.capacity_limit,
        )
        .all()
    )

    target = (customer.city or "").strip().lower()
    return [
        b for b in candidates
        if b.city.strip().lower() == target
        or target in [r.strip().lower() for r in (b.regions_covered or [])]
    ]


async def get_broker_recommendations(customer: Customer, brokers: List[Broker]) -> List[Dict]:
    if not brokers:
        return []

    if settings.DEMO_MODE or not settings.GEMINI_API_KEY:
        valid_ids = {b.id for b in brokers}
        return [r for r in DEMO_RECOMMENDATIONS if r["broker_id"] in valid_ids][:3]

    customer_data = {
        "name": customer.name,
        "city": customer.city,
        "budget_min": customer.budget_min,
        "budget_max": customer.budget_max,
        "preferred_regions": customer.preferred_regions,
        "apartment_type": customer.apartment_type,
        "furnished_status": customer.furnished_status,
        "parking_required": customer.parking_required,
        "pets_allowed": customer.pets_allowed,
        "office_location": customer.office_location,
        "move_date": customer.move_date,
        "special_requirements": customer.special_requirements,
    }

    brokers_data = [
        {
            "id": b.id,
            "name": b.name,
            "city": b.city,
            "regions_covered": b.regions_covered,
            "property_types": b.property_types,
            "budget_min": b.budget_min,
            "budget_max": b.budget_max,
            "current_active_count": b.current_active_count,
            "capacity_limit": b.capacity_limit,
            "avg_response_time_hours": b.avg_response_time_hours,
            "rating": b.rating,
        }
        for b in brokers
    ]

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    prompt = RECOMMENDATION_PROMPT.format(
        customer_json=json.dumps(customer_data, indent=2),
        brokers_json=json.dumps(brokers_data, indent=2),
    )

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    raw = response.text.strip()

    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        result = json.loads(raw)
        return result[:3] if isinstance(result, list) else []
    except json.JSONDecodeError:
        match = re.search(r"\[.*\]", raw, re.DOTALL)
        if match:
            return json.loads(match.group())[:3]
        raise ValueError(f"Could not parse recommendations JSON: {raw[:300]}")
