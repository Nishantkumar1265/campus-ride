import mysql.connector
import os
from dotenv import load_dotenv

# .env file load karna
load_dotenv()

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT", 3306),  # Cloud port ke liye ye add kiya
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            ssl_disabled=False  # Aiven Cloud ke liye SSL REQUIRED hai isliye ye joda gaya
        )
        return connection
    except mysql.connector.Error as err:
        print(f"❌ Error connecting to database: {err}")
        return None