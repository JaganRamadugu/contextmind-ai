import sys
from pathlib import Path

# Ensure backend directory is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import test_connection

if __name__ == "__main__":
    result = test_connection()
    if result:
        print("Database setup completed!")
    else:
        print("Please check your MongoDB configuration.")
