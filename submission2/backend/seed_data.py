"""
Run this once to populate sample broker data.
  cd submission2/backend
  python seed_data.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.broker import Broker

Base.metadata.create_all(bind=engine)

BROKERS = [
    # ── Bengaluru ────────────────────────────────────────────────────────────
    {
        "name": "Ravi Kumar",
        "email": "ravi.kumar@propertiesblr.com",
        "phone": "+91 98450 12345",
        "city": "Bengaluru",
        "regions_covered": ["Whitefield", "Marathahalli", "ITPL", "Brookfield", "Varthur"],
        "property_types": ["2BHK", "3BHK"],
        "budget_min": 20000,
        "budget_max": 45000,
        "current_active_count": 3,
        "capacity_limit": 10,
        "avg_response_time_hours": 4.5,
        "rating": 4.8,
    },
    {
        "name": "Priya Sharma",
        "email": "priya.sharma@blrhomes.com",
        "phone": "+91 98450 23456",
        "city": "Bengaluru",
        "regions_covered": ["Koramangala", "HSR Layout", "BTM Layout", "Jayanagar", "JP Nagar"],
        "property_types": ["1BHK", "2BHK", "Studio"],
        "budget_min": 15000,
        "budget_max": 40000,
        "current_active_count": 7,
        "capacity_limit": 10,
        "avg_response_time_hours": 6.0,
        "rating": 4.6,
    },
    {
        "name": "Suresh Nair",
        "email": "suresh.nair@nairbrokerage.com",
        "phone": "+91 98450 34567",
        "city": "Bengaluru",
        "regions_covered": ["Indiranagar", "Domlur", "Ulsoor", "Richmond Town", "Langford Town"],
        "property_types": ["2BHK", "3BHK", "4BHK", "Villa"],
        "budget_min": 30000,
        "budget_max": 90000,
        "current_active_count": 4,
        "capacity_limit": 8,
        "avg_response_time_hours": 3.0,
        "rating": 4.9,
    },
    {
        "name": "Anita Reddy",
        "email": "anita.reddy@southblrprop.com",
        "phone": "+91 98450 45678",
        "city": "Bengaluru",
        "regions_covered": ["Electronic City", "Sarjapur Road", "Bellandur", "HSR Layout"],
        "property_types": ["1BHK", "2BHK", "3BHK"],
        "budget_min": 12000,
        "budget_max": 35000,
        "current_active_count": 8,
        "capacity_limit": 12,
        "avg_response_time_hours": 8.0,
        "rating": 4.3,
    },
    {
        "name": "Vikram Menon",
        "email": "vikram.menon@northblr.com",
        "phone": "+91 98450 56789",
        "city": "Bengaluru",
        "regions_covered": ["Hebbal", "Yelahanka", "Devanahalli", "Hennur", "Banaswadi"],
        "property_types": ["2BHK", "3BHK", "Villa", "Row House"],
        "budget_min": 18000,
        "budget_max": 55000,
        "current_active_count": 2,
        "capacity_limit": 8,
        "avg_response_time_hours": 5.0,
        "rating": 4.7,
    },
    {
        "name": "Deepa Krishnan",
        "email": "deepa.k@westblrhomes.com",
        "phone": "+91 98450 67890",
        "city": "Bengaluru",
        "regions_covered": ["Rajajinagar", "Vijayanagar", "Malleswaram", "Basaveshwaranagar"],
        "property_types": ["1BHK", "2BHK"],
        "budget_min": 10000,
        "budget_max": 25000,
        "current_active_count": 5,
        "capacity_limit": 10,
        "avg_response_time_hours": 12.0,
        "rating": 4.1,
    },
    # ── Hyderabad ─────────────────────────────────────────────────────────────
    {
        "name": "Mohammed Faiz",
        "email": "faiz@hydhomes.com",
        "phone": "+91 99850 11111",
        "city": "Hyderabad",
        "regions_covered": ["Gachibowli", "Madhapur", "HITEC City", "Kondapur", "Manikonda"],
        "property_types": ["2BHK", "3BHK"],
        "budget_min": 18000,
        "budget_max": 45000,
        "current_active_count": 4,
        "capacity_limit": 10,
        "avg_response_time_hours": 5.0,
        "rating": 4.7,
    },
    {
        "name": "Lakshmi Prasad",
        "email": "lakshmi.p@hydproperties.com",
        "phone": "+91 99850 22222",
        "city": "Hyderabad",
        "regions_covered": ["Jubilee Hills", "Banjara Hills", "Somajiguda", "Begumpet"],
        "property_types": ["3BHK", "4BHK", "Penthouse"],
        "budget_min": 35000,
        "budget_max": 100000,
        "current_active_count": 2,
        "capacity_limit": 6,
        "avg_response_time_hours": 3.5,
        "rating": 4.9,
    },
    # ── Mumbai ────────────────────────────────────────────────────────────────
    {
        "name": "Rahul Mehta",
        "email": "rahul.mehta@mumbaiprops.com",
        "phone": "+91 98200 11111",
        "city": "Mumbai",
        "regions_covered": ["Powai", "Andheri East", "Vikhroli", "Ghatkopar"],
        "property_types": ["1BHK", "2BHK"],
        "budget_min": 25000,
        "budget_max": 55000,
        "current_active_count": 6,
        "capacity_limit": 10,
        "avg_response_time_hours": 6.0,
        "rating": 4.5,
    },
    {
        "name": "Sneha Desai",
        "email": "sneha.d@westernmumbai.com",
        "phone": "+91 98200 22222",
        "city": "Mumbai",
        "regions_covered": ["Bandra", "Khar", "Santacruz", "Vile Parle"],
        "property_types": ["1BHK", "2BHK", "Studio"],
        "budget_min": 30000,
        "budget_max": 75000,
        "current_active_count": 3,
        "capacity_limit": 8,
        "avg_response_time_hours": 4.0,
        "rating": 4.8,
    },
    # ── Pune ──────────────────────────────────────────────────────────────────
    {
        "name": "Anil Kulkarni",
        "email": "anil.k@punerealty.com",
        "phone": "+91 98220 11111",
        "city": "Pune",
        "regions_covered": ["Hinjewadi", "Wakad", "Baner", "Balewadi", "Pimple Saudagar"],
        "property_types": ["2BHK", "3BHK"],
        "budget_min": 15000,
        "budget_max": 35000,
        "current_active_count": 5,
        "capacity_limit": 12,
        "avg_response_time_hours": 7.0,
        "rating": 4.4,
    },
    {
        "name": "Neha Joshi",
        "email": "neha.j@puneproperties.com",
        "phone": "+91 98220 22222",
        "city": "Pune",
        "regions_covered": ["Koregaon Park", "Kalyani Nagar", "Viman Nagar", "Hadapsar"],
        "property_types": ["1BHK", "2BHK", "Studio"],
        "budget_min": 12000,
        "budget_max": 28000,
        "current_active_count": 4,
        "capacity_limit": 10,
        "avg_response_time_hours": 5.5,
        "rating": 4.6,
    },
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(Broker).count()
        if existing > 0:
            print(f"Database already has {existing} brokers - skipping seed.")
            return
        for data in BROKERS:
            db.add(Broker(**data))
        db.commit()
        print(f"[OK] Seeded {len(BROKERS)} brokers across Bengaluru, Hyderabad, Mumbai, Pune.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
