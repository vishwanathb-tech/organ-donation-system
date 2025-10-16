from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Blood type compatibility checker
def is_blood_compatible(donor_blood: str, recipient_blood: str) -> bool:
    compatibility = {
        "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
        "O+": ["O+", "A+", "B+", "AB+"],
        "A-": ["A-", "A+", "AB-", "AB+"],
        "A+": ["A+", "AB+"],
        "B-": ["B-", "B+", "AB-", "AB+"],
        "B+": ["B+", "AB+"],
        "AB-": ["AB-", "AB+"],
        "AB+": ["AB+"]
    }
    return recipient_blood in compatibility.get(donor_blood, [])

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str  # donor, recipient, hospital
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class DonorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    blood_type: str
    age: int
    organs_available: List[str]  # heart, kidney, liver, lungs, pancreas, intestines
    medical_history: Optional[str] = None
    status: str = "available"  # available, matched, donated
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DonorProfileCreate(BaseModel):
    blood_type: str
    age: int
    organs_available: List[str]
    medical_history: Optional[str] = None

class RecipientProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    blood_type: str
    age: int
    organs_needed: List[str]
    urgency_level: str  # low, medium, high, critical
    medical_history: Optional[str] = None
    status: str = "waiting"  # waiting, matched, received
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecipientProfileCreate(BaseModel):
    blood_type: str
    age: int
    organs_needed: List[str]
    urgency_level: str
    medical_history: Optional[str] = None

class HospitalProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    hospital_name: str
    location: str
    contact_number: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HospitalProfileCreate(BaseModel):
    hospital_name: str
    location: str
    contact_number: str

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    donor_id: str
    recipient_id: str
    organ_type: str
    compatibility_score: int  # 0-100
    status: str = "pending"  # pending, accepted, rejected, completed
    created_by: str  # hospital user_id
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MatchCreate(BaseModel):
    donor_id: str
    recipient_id: str
    organ_type: str

class MatchStatusUpdate(BaseModel):
    status: str


# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "LifeLink API - Organ Donation Platform"}

# Authentication routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    if user_data.role not in ["donor", "recipient", "hospital"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token({"user_id": user.id, "email": user.email, "role": user.role})
    
    return TokenResponse(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Parse created_at back to datetime for response
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user_obj = User(**user)
    access_token = create_access_token({"user_id": user_obj.id, "email": user_obj.email, "role": user_obj.role})
    
    return TokenResponse(access_token=access_token, user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    if isinstance(current_user['created_at'], str):
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
    return User(**current_user)

# Donor routes
@api_router.post("/donors", response_model=DonorProfile)
async def create_donor_profile(profile_data: DonorProfileCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'donor':
        raise HTTPException(status_code=403, detail="Only donors can create donor profiles")
    
    # Check if profile already exists
    existing = await db.donor_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Donor profile already exists")
    
    profile = DonorProfile(
        user_id=current_user['id'],
        **profile_data.model_dump()
    )
    
    profile_dict = profile.model_dump()
    profile_dict['created_at'] = profile_dict['created_at'].isoformat()
    
    await db.donor_profiles.insert_one(profile_dict)
    return profile

@api_router.get("/donors/me", response_model=DonorProfile)
async def get_my_donor_profile(current_user: dict = Depends(get_current_user)):
    profile = await db.donor_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Donor profile not found")
    
    if isinstance(profile['created_at'], str):
        profile['created_at'] = datetime.fromisoformat(profile['created_at'])
    
    return DonorProfile(**profile)

@api_router.put("/donors/me", response_model=DonorProfile)
async def update_my_donor_profile(profile_data: DonorProfileCreate, current_user: dict = Depends(get_current_user)):
    result = await db.donor_profiles.find_one_and_update(
        {"user_id": current_user['id']},
        {"$set": profile_data.model_dump()},
        return_document=True,
        projection={"_id": 0}
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Donor profile not found")
    
    if isinstance(result['created_at'], str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    
    return DonorProfile(**result)

@api_router.get("/donors", response_model=List[DonorProfile])
async def get_all_donors(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['hospital', 'recipient']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    donors = await db.donor_profiles.find({}, {"_id": 0}).to_list(1000)
    
    for donor in donors:
        if isinstance(donor['created_at'], str):
            donor['created_at'] = datetime.fromisoformat(donor['created_at'])
    
    return [DonorProfile(**d) for d in donors]

# Recipient routes
@api_router.post("/recipients", response_model=RecipientProfile)
async def create_recipient_profile(profile_data: RecipientProfileCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'recipient':
        raise HTTPException(status_code=403, detail="Only recipients can create recipient profiles")
    
    existing = await db.recipient_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Recipient profile already exists")
    
    profile = RecipientProfile(
        user_id=current_user['id'],
        **profile_data.model_dump()
    )
    
    profile_dict = profile.model_dump()
    profile_dict['created_at'] = profile_dict['created_at'].isoformat()
    
    await db.recipient_profiles.insert_one(profile_dict)
    return profile

@api_router.get("/recipients/me", response_model=RecipientProfile)
async def get_my_recipient_profile(current_user: dict = Depends(get_current_user)):
    profile = await db.recipient_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Recipient profile not found")
    
    if isinstance(profile['created_at'], str):
        profile['created_at'] = datetime.fromisoformat(profile['created_at'])
    
    return RecipientProfile(**profile)

@api_router.put("/recipients/me", response_model=RecipientProfile)
async def update_my_recipient_profile(profile_data: RecipientProfileCreate, current_user: dict = Depends(get_current_user)):
    result = await db.recipient_profiles.find_one_and_update(
        {"user_id": current_user['id']},
        {"$set": profile_data.model_dump()},
        return_document=True,
        projection={"_id": 0}
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Recipient profile not found")
    
    if isinstance(result['created_at'], str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    
    return RecipientProfile(**result)

@api_router.get("/recipients", response_model=List[RecipientProfile])
async def get_all_recipients(current_user: dict = Depends(get_current_user)):
    if current_user['role'] not in ['hospital', 'donor']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    recipients = await db.recipient_profiles.find({}, {"_id": 0}).to_list(1000)
    
    for recipient in recipients:
        if isinstance(recipient['created_at'], str):
            recipient['created_at'] = datetime.fromisoformat(recipient['created_at'])
    
    return [RecipientProfile(**r) for r in recipients]

# Hospital routes
@api_router.post("/hospitals", response_model=HospitalProfile)
async def create_hospital_profile(profile_data: HospitalProfileCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'hospital':
        raise HTTPException(status_code=403, detail="Only hospitals can create hospital profiles")
    
    existing = await db.hospital_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Hospital profile already exists")
    
    profile = HospitalProfile(
        user_id=current_user['id'],
        **profile_data.model_dump()
    )
    
    profile_dict = profile.model_dump()
    profile_dict['created_at'] = profile_dict['created_at'].isoformat()
    
    await db.hospital_profiles.insert_one(profile_dict)
    return profile

@api_router.get("/hospitals/me", response_model=HospitalProfile)
async def get_my_hospital_profile(current_user: dict = Depends(get_current_user)):
    profile = await db.hospital_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Hospital profile not found")
    
    if isinstance(profile['created_at'], str):
        profile['created_at'] = datetime.fromisoformat(profile['created_at'])
    
    return HospitalProfile(**profile)

# Matching routes
@api_router.get("/matches")
async def get_matches(current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user['role'] == 'donor':
        donor_profile = await db.donor_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
        if not donor_profile:
            return []
        query = {"donor_id": donor_profile['id']}
    elif current_user['role'] == 'recipient':
        recipient_profile = await db.recipient_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
        if not recipient_profile:
            return []
        query = {"recipient_id": recipient_profile['id']}
    
    matches = await db.matches.find(query, {"_id": 0}).to_list(1000)
    
    for match in matches:
        if isinstance(match['created_at'], str):
            match['created_at'] = datetime.fromisoformat(match['created_at'])
    
    return matches

@api_router.post("/matches", response_model=Match)
async def create_match(match_data: MatchCreate, current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'hospital':
        raise HTTPException(status_code=403, detail="Only hospitals can create matches")
    
    # Verify donor and recipient exist
    donor = await db.donor_profiles.find_one({"id": match_data.donor_id}, {"_id": 0})
    recipient = await db.recipient_profiles.find_one({"id": match_data.recipient_id}, {"_id": 0})
    
    if not donor or not recipient:
        raise HTTPException(status_code=404, detail="Donor or recipient not found")
    
    # Check blood compatibility
    if not is_blood_compatible(donor['blood_type'], recipient['blood_type']):
        raise HTTPException(status_code=400, detail="Blood types are not compatible")
    
    # Check if organ is available
    if match_data.organ_type not in donor['organs_available']:
        raise HTTPException(status_code=400, detail="Organ not available from this donor")
    
    if match_data.organ_type not in recipient['organs_needed']:
        raise HTTPException(status_code=400, detail="Recipient doesn't need this organ")
    
    # Calculate compatibility score
    compatibility_score = 80  # Base score for blood compatibility
    if donor['blood_type'] == recipient['blood_type']:
        compatibility_score = 100  # Perfect match
    
    match = Match(
        donor_id=match_data.donor_id,
        recipient_id=match_data.recipient_id,
        organ_type=match_data.organ_type,
        compatibility_score=compatibility_score,
        created_by=current_user['id']
    )
    
    match_dict = match.model_dump()
    match_dict['created_at'] = match_dict['created_at'].isoformat()
    
    await db.matches.insert_one(match_dict)
    return match

@api_router.get("/matches/potential")
async def get_potential_matches(current_user: dict = Depends(get_current_user)):
    """Get potential matches based on blood type and organ compatibility"""
    
    if current_user['role'] == 'recipient':
        # Get recipient profile
        recipient = await db.recipient_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
        if not recipient:
            return []
        
        # Find compatible donors
        all_donors = await db.donor_profiles.find({"status": "available"}, {"_id": 0}).to_list(1000)
        compatible_donors = []
        
        for donor in all_donors:
            # Check blood compatibility
            if is_blood_compatible(donor['blood_type'], recipient['blood_type']):
                # Check if any needed organ is available
                matching_organs = set(recipient['organs_needed']) & set(donor['organs_available'])
                if matching_organs:
                    donor['matching_organs'] = list(matching_organs)
                    donor['compatibility_score'] = 100 if donor['blood_type'] == recipient['blood_type'] else 80
                    compatible_donors.append(donor)
        
        return compatible_donors
    
    elif current_user['role'] == 'donor':
        # Get donor profile
        donor = await db.donor_profiles.find_one({"user_id": current_user['id']}, {"_id": 0})
        if not donor:
            return []
        
        # Find compatible recipients
        all_recipients = await db.recipient_profiles.find({"status": "waiting"}, {"_id": 0}).to_list(1000)
        compatible_recipients = []
        
        for recipient in all_recipients:
            # Check blood compatibility
            if is_blood_compatible(donor['blood_type'], recipient['blood_type']):
                # Check if any available organ is needed
                matching_organs = set(donor['organs_available']) & set(recipient['organs_needed'])
                if matching_organs:
                    recipient['matching_organs'] = list(matching_organs)
                    recipient['compatibility_score'] = 100 if donor['blood_type'] == recipient['blood_type'] else 80
                    compatible_recipients.append(recipient)
        
        return compatible_recipients
    
    return []

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()