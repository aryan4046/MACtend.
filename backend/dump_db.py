from database import db
import json
from bson import json_util

dump = {
    'session': db.active_session.find_one({'id': 1}),
    'students': list(db.students.find()),
    'attendance': list(db.attendance.find().sort('_id', -1).limit(20))
}

with open('db_dump.json', 'w') as f:
    json.dump(dump, f, default=json_util.default, indent=2)

print("Dumped to db_dump.json")
