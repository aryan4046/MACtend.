from datetime import datetime
from database import db

# Clear existing timetable
db.timetable.delete_many({})

timetable_data = [
    # Monday
    {"day": "Monday", "start_time": "10:00", "end_time": "10:50", "subject": "Data Structures", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Monday", "start_time": "10:50", "end_time": "11:40", "subject": "Computer Networks", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Monday", "start_time": "11:40", "end_time": "12:30", "subject": "LUNCH", "programme": "", "branch": "", "semester": "", "section": ""},
    {"day": "Monday", "start_time": "12:30", "end_time": "01:20", "subject": "Operating Systems", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Monday", "start_time": "01:20", "end_time": "02:10", "subject": "Software Engineering", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Monday", "start_time": "02:10", "end_time": "03:00", "subject": "DBMS", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Monday", "start_time": "03:00", "end_time": "03:50", "subject": "TOC", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    
    # Tuesday
    {"day": "Tuesday", "start_time": "10:00", "end_time": "10:50", "subject": "Web Tech", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Tuesday", "start_time": "10:50", "end_time": "11:40", "subject": "Java Programming", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Tuesday", "start_time": "11:40", "end_time": "12:30", "subject": "LUNCH", "programme": "", "branch": "", "semester": "", "section": ""},
    {"day": "Tuesday", "start_time": "12:30", "end_time": "01:20", "subject": "Python", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Tuesday", "start_time": "01:20", "end_time": "02:10", "subject": "AI Fundamentals", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Tuesday", "start_time": "02:10", "end_time": "03:00", "subject": "Machine Learning", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Tuesday", "start_time": "03:00", "end_time": "03:50", "subject": "Deep Learning", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},

    # Wednesday
    {"day": "Wednesday", "start_time": "10:00", "end_time": "10:50", "subject": "Engineering Math", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Wednesday", "start_time": "10:50", "end_time": "11:40", "subject": "Applied Physics", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Wednesday", "start_time": "11:40", "end_time": "12:30", "subject": "LUNCH", "programme": "", "branch": "", "semester": "", "section": ""},
    {"day": "Wednesday", "start_time": "12:30", "end_time": "01:20", "subject": "App Dev", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Wednesday", "start_time": "01:20", "end_time": "02:10", "subject": "Software Testing", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Wednesday", "start_time": "02:10", "end_time": "03:00", "subject": "Cloud Computing", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Wednesday", "start_time": "03:00", "end_time": "03:50", "subject": "Cyber Security", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},

    # Thursday
    {"day": "Thursday", "start_time": "10:00", "end_time": "10:50", "subject": "Distributed Systems", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Thursday", "start_time": "10:50", "end_time": "11:40", "subject": "Big Data", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Thursday", "start_time": "11:40", "end_time": "12:30", "subject": "LUNCH", "programme": "", "branch": "", "semester": "", "section": ""},
    {"day": "Thursday", "start_time": "12:30", "end_time": "01:20", "subject": "IoT", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Thursday", "start_time": "01:20", "end_time": "02:10", "subject": "Compiler Design", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Thursday", "start_time": "02:10", "end_time": "03:00", "subject": "Graphics", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Thursday", "start_time": "03:00", "end_time": "03:50", "subject": "Multimedia", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},

    # Friday
    {"day": "Friday", "start_time": "10:00", "end_time": "10:50", "subject": "Project Phase 1", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Friday", "start_time": "10:50", "end_time": "11:40", "subject": "Seminar", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Friday", "start_time": "11:40", "end_time": "12:30", "subject": "LUNCH", "programme": "", "branch": "", "semester": "", "section": ""},
    {"day": "Friday", "start_time": "12:30", "end_time": "01:20", "subject": "Practical Lab", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Friday", "start_time": "01:20", "end_time": "02:10", "subject": "Professional Ethics", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Friday", "start_time": "02:10", "end_time": "03:00", "subject": "Management", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Friday", "start_time": "03:00", "end_time": "03:50", "subject": "Library", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},

    # Saturday
    {"day": "Saturday", "start_time": "10:00", "end_time": "10:50", "subject": "Guest Lecture", "programme": "btech", "branch": "it", "semester": "6", "section": "A"},
    {"day": "Saturday", "start_time": "10:50", "end_time": "11:40", "subject": "Sports", "programme": "", "branch": "", "semester": "", "section": ""},
    {"day": "Saturday", "start_time": "11:40", "end_time": "12:30", "subject": "LUNCH", "programme": "", "branch": "", "semester": "", "section": ""},
    {"day": "Saturday", "start_time": "12:30", "end_time": "01:20", "subject": "Cultural Activity", "programme": "", "branch": "", "semester": "", "section": ""},
    {"day": "Saturday", "start_time": "01:20", "end_time": "02:10", "subject": "Meeting", "programme": "", "branch": "", "semester": "", "section": ""},
    {"day": "Saturday", "start_time": "02:10", "end_time": "03:00", "subject": "Free Period", "programme": "", "branch": "", "semester": "", "section": ""},
    {"day": "Saturday", "start_time": "03:00", "end_time": "03:50", "subject": "Free Period", "programme": "", "branch": "", "semester": "", "section": ""},
]

db.timetable.insert_many(timetable_data)
print(f"Successfully populated MongoDB with {len(timetable_data)} timetable entries.")
