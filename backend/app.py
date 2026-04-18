from flask import Flask, jsonify, request
from flask_cors import CORS
from config.db import get_db_connection
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)
CORS(app)

# Test Route
@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Campus Ride Sharing Python API is running! 🚗💨"})

# ----------------------------------------------------
# 🧑‍🎓 USER AUTHENTICATION APIs (Registration & Login)
# ----------------------------------------------------

# 1. Register User API
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() # Frontend se aane wala data
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role') # 'driver' ya 'passenger'

    if not name or not email or not password or not role:
        return jsonify({"error": "Saari details fill karna zaroori hai!"}), 400

    # Password ko secure banane ke liye hash karna
    hashed_password = generate_password_hash(password)

    conn = get_db_connection()
    if not conn:
         return jsonify({"error": "Database error"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # User ko database mein insert karna
        sql = "INSERT INTO Users (name, email, password, role) VALUES (%s, %s, %s, %s)"
        val = (name, email, hashed_password, role)
        cursor.execute(sql, val)
        conn.commit()
        
        return jsonify({"message": "User successfully registered!", "user_id": cursor.lastrowid}), 201
    
    except Exception as e:
        # Agar email already exist karta hai
        return jsonify({"error": "Yeh email pehle se registered hai ya koi error aayi."}), 400
    
    finally:
        cursor.close()
        conn.close()

# 2. Login User API
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email aur password dono daalein!"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Database se user dhoondhna
        cursor.execute("SELECT * FROM Users WHERE email = %s", (email,))
        user = cursor.fetchone()

        # Agar user mila aur password hash match ho gaya
        if user and check_password_hash(user['password'], password):
            # Password ko response se hata dena security ke liye
            user.pop('password') 
            return jsonify({"message": "Login successful!", "user": user}), 200
        else:
            return jsonify({"error": "Galat email ya password!"}), 401

    finally:
        cursor.close()
        conn.close()

# ----------------------------------------------------
# 🚗 RIDE APIs (Post & Fetch Rides)
# ----------------------------------------------------

# 3. Post a Ride API
@app.route('/api/rides', methods=['POST'])
def post_ride():
    data = request.get_json()
    
    driver_id = data.get('driver_id')
    source = data.get('source')
    destination = data.get('destination')
    departure_time = data.get('departure_time') # Format: YYYY-MM-DD HH:MM:SS
    seats_available = data.get('seats_available')
    cost_per_seat = data.get('cost_per_seat')

    if not all([driver_id, source, destination, departure_time, seats_available, cost_per_seat]):
        return jsonify({"error": "Saari details (source, destination, etc.) zaroori hain!"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        sql = """INSERT INTO Rides (driver_id, source, destination, departure_time, seats_available, cost_per_seat) 
                 VALUES (%s, %s, %s, %s, %s, %s)"""
        val = (driver_id, source, destination, departure_time, seats_available, cost_per_seat)
        
        cursor.execute(sql, val)
        conn.commit()
        
        return jsonify({"message": "Ride successfully posted!", "ride_id": cursor.lastrowid}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 4. Get All Available Rides API
@app.route('/api/rides', methods=['GET'])
def get_rides():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # SQL JOIN use kar rahe hain taaki Driver ka naam aur rating bhi mil jaye
        sql = """
            SELECT r.*, u.name as driver_name, u.rating as driver_rating
            FROM Rides r
            JOIN Users u ON r.driver_id = u.user_id
            WHERE r.status = 'posted' AND r.seats_available > 0
            ORDER BY r.departure_time ASC
        """
        cursor.execute(sql)
        rides = cursor.fetchall()
        return jsonify(rides), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ----------------------------------------------------
# 🎟️ BOOKING & RIDE MANAGEMENT APIs (Request, Accept, Start)
# ----------------------------------------------------

# 5. Request a Ride (Passenger)
@app.route('/api/bookings', methods=['POST'])
def book_ride():
    data = request.get_json()
    ride_id = data.get('ride_id')
    passenger_id = data.get('passenger_id')

    if not ride_id or not passenger_id:
        return jsonify({"error": "Ride ID aur Passenger ID zaroori hai!"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if seat is available (Par abhi minus nahi karenge)
        cursor.execute("SELECT seats_available FROM Rides WHERE ride_id = %s", (ride_id,))
        ride = cursor.fetchone()

        if not ride or ride['seats_available'] <= 0:
            return jsonify({"error": "Sorry, is ride mein koi seat available nahi hai!"}), 400

        # Booking ko 'pending' status ke sath save karna
        cursor.execute(
            "INSERT INTO Bookings (ride_id, passenger_id, status) VALUES (%s, %s, 'pending')",
            (ride_id, passenger_id)
        )
        conn.commit()
        return jsonify({"message": "Ride request sent to driver! ⏳"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 6. Driver ke Passenger Requests Fetch karna (Pending + Accepted)
@app.route('/api/driver/requests/<int:driver_id>', methods=['GET'])
def get_driver_requests(driver_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        sql = """
            SELECT b.booking_id, b.status as booking_status, u.name as passenger_name, 
                   r.source, r.destination, r.ride_id
            FROM Bookings b
            JOIN Rides r ON b.ride_id = r.ride_id
            JOIN Users u ON b.passenger_id = u.user_id
            WHERE r.driver_id = %s AND b.status IN ('pending', 'accepted')
        """
        cursor.execute(sql, (driver_id,))
        requests = cursor.fetchall()
        return jsonify(requests), 200
    finally:
        cursor.close()
        conn.close()

# 7. Driver Request ko Accept ya Reject karega
@app.route('/api/bookings/<int:booking_id>/respond', methods=['PUT'])
def respond_booking(booking_id):
    data = request.get_json()
    action = data.get('action') # 'accepted' ya 'rejected' aayega frontend se
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if action == 'accepted':
            # Ride ID pata karke Seat minus karni hai
            cursor.execute("SELECT ride_id FROM Bookings WHERE booking_id = %s", (booking_id,))
            booking = cursor.fetchone()
            if booking:
                cursor.execute("UPDATE Rides SET seats_available = seats_available - 1 WHERE ride_id = %s", (booking['ride_id'],))
        
        # Booking ka status update karna ('accepted' ya 'rejected')
        cursor.execute("UPDATE Bookings SET status = %s WHERE booking_id = %s", (action, booking_id))
        conn.commit()
        return jsonify({"message": f"Request {action} successfully!"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 8. Driver Ride Start karega
@app.route('/api/rides/<int:ride_id>/start', methods=['PUT'])
def start_ride(ride_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Ride ka status change karke 'in_progress' karna
        cursor.execute("UPDATE Rides SET status = 'in_progress' WHERE ride_id = %s", (ride_id,))
        conn.commit()
        return jsonify({"message": "Ride started! 🚗💨"}), 200
    finally:
        cursor.close()
        conn.close()

# 6. Get My Bookings API (Passenger Dashboard)
@app.route('/api/my-bookings/<int:user_id>', methods=['GET'])
def get_my_bookings(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 3 tables (Bookings, Rides, Users) ko JOIN kar rahe hain
        sql = """
            SELECT b.booking_id, b.status as booking_status, b.created_at as booked_on,
                   r.source, r.destination, r.departure_time, r.cost_per_seat,
                   u.name as driver_name, u.rating as driver_rating
            FROM Bookings b
            JOIN Rides r ON b.ride_id = r.ride_id
            JOIN Users u ON r.driver_id = u.user_id
            WHERE b.passenger_id = %s
            ORDER BY r.departure_time DESC
        """
        cursor.execute(sql, (user_id,))
        my_rides = cursor.fetchall()
        
        return jsonify(my_rides), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 9. Get Driver's Posted Rides (Dashboard ke liye)
@app.route('/api/driver/rides/<int:driver_id>', methods=['GET'])
def get_driver_rides(driver_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM Rides WHERE driver_id = %s ORDER BY departure_time DESC", (driver_id,))
        rides = cursor.fetchall()
        return jsonify(rides), 200
    finally:
        cursor.close()
        conn.close()

# ----------------------------------------------------
# ⭐ RATING & COMPLETION APIs
# ----------------------------------------------------

# 10. Driver Ride ko 'Complete' karega
@app.route('/api/rides/<int:ride_id>/complete', methods=['PUT'])
def complete_ride(ride_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Ride ka status aur us ride ki saari bookings ka status 'completed' kar do
        cursor.execute("UPDATE Rides SET status = 'completed' WHERE ride_id = %s", (ride_id,))
        cursor.execute("UPDATE Bookings SET status = 'completed' WHERE ride_id = %s", (ride_id,))
        conn.commit()
        return jsonify({"message": "Ride completed successfully! 🎉"}), 200
    finally:
        cursor.close()
        conn.close()

# 11. Passenger Driver ko Rate karega
@app.route('/api/bookings/<int:booking_id>/rate', methods=['PUT'])
def rate_driver(booking_id):
    data = request.get_json()
    rating = data.get('rating') # 1 se 5 tak number aayega
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Booking table mein rating save karo
        cursor.execute("UPDATE Bookings SET rating = %s WHERE booking_id = %s", (rating, booking_id))
        
        # 2. Driver ka naya Average Rating calculate karke Users table mein update karo
        # Pehle driver ki ID nikalo
        cursor.execute("""
            SELECT r.driver_id FROM Bookings b
            JOIN Rides r ON b.ride_id = r.ride_id
            WHERE b.booking_id = %s
        """, (booking_id,))
        driver = cursor.fetchone()
        
        if driver:
            driver_id = driver['driver_id']
            # Sabhi ratings ka average nikalo
            cursor.execute("""
                SELECT AVG(b.rating) as avg_rating FROM Bookings b
                JOIN Rides r ON b.ride_id = r.ride_id
                WHERE r.driver_id = %s AND b.rating IS NOT NULL
            """, (driver_id,))
            avg_data = cursor.fetchone()
            new_avg = round(avg_data['avg_rating'], 1)
            
            # Users table mein driver ki profile update karo
            cursor.execute("UPDATE Users SET rating = %s WHERE user_id = %s", (new_avg, driver_id))
        
        conn.commit()
        return jsonify({"message": "Thank you for rating! ⭐"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ----------------------------------------------------
# 💬 CHAT SYSTEM APIs
# ----------------------------------------------------

# 12. Message send karna
@app.route('/api/chat/send', methods=['POST'])
def send_message():
    data = request.get_json()
    booking_id = data.get('booking_id')
    sender_id = data.get('sender_id')
    message_text = data.get('message_text')

    if not all([booking_id, sender_id, message_text]):
        return jsonify({"error": "Missing data"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO Messages (booking_id, sender_id, message_text) VALUES (%s, %s, %s)",
            (booking_id, sender_id, message_text)
        )
        conn.commit()
        return jsonify({"message": "Message sent!"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 13. Kisi specific booking ke messages fetch karna
@app.route('/api/chat/<int:booking_id>', methods=['GET'])
def get_messages(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Hum sender ka naam bhi nikal lenge taaki UI mein dikha sakein
        sql = """
            SELECT m.message_id, m.message_text, m.sent_at, m.sender_id, u.name as sender_name
            FROM Messages m
            JOIN Users u ON m.sender_id = u.user_id
            WHERE m.booking_id = %s
            ORDER BY m.sent_at ASC
        """
        cursor.execute(sql, (booking_id,))
        messages = cursor.fetchall()
        return jsonify(messages), 200
    finally:
        cursor.close()
        conn.close()

# ----------------------------------------------------

# New API: Get Driver's Total Earnings
@app.route('/api/driver/earnings/<int:driver_id>', methods=['GET'])
def get_driver_earnings(driver_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # We calculate: cost_per_seat * number of accepted bookings for completed rides
        sql = """
            SELECT SUM(r.cost_per_seat) as total_earnings
            FROM Bookings b
            JOIN Rides r ON b.ride_id = r.ride_id
            WHERE r.driver_id = %s 
            AND r.status = 'completed' 
            AND b.status = 'accepted'
        """
        cursor.execute(sql, (driver_id,))
        result = cursor.fetchone()
        
        # If no rides completed yet, return 0
        earnings = result['total_earnings'] if result['total_earnings'] else 0
        return jsonify({"total_earnings": float(earnings)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    # Render par host="0.0.0.0" hona zaroori hai taaki external requests allow ho sakein
    app.run(host="0.0.0.0", port=port, debug=False)