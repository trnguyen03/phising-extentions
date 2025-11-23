import os


ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "*").split(",")
MONGO_URI = os.getenv("MONGO_URI", "")
PORT = int(os.getenv("PORT", "8000"))

