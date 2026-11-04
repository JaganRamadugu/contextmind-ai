from pymongo import MongoClient
import certifi
from app.config import DATABASE_NAME, MONGODB_URI

# Connect to MongoDB Atlas
client = MongoClient(
    MONGODB_URI,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=5000
)

# Select database
db = client[DATABASE_NAME]

# Select collections
conversations_collection = db["conversations"]
messages_collection = db["messages"]


def test_connection():
    try:
        client.admin.command("ping")
        print("MongoDB connected successfully!")
        return True
    except Exception as e:
        print("MongoDB connection failed:", e)
        return False
