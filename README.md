
  # Smart Classroom Attendance System

  This is a code bundle for Smart Classroom Attendance System. The original project is available at https://www.figma.com/design/j2MtENDq5SKyaChwvEY3sL/Smart-Classroom-Attendance-System.

## Running the code on Windows

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

Or simply double click on `run_all.bat` to launch the backend, frontend, and scanner automatically.

## Running the code on Raspberry Pi (Linux)

You can use the automated launch script that handles virtual environments, python dependencies, and frontend booting:

```bash
chmod +x run_all.sh
./run_all.sh
```

Alternatively, you can run them manually:
1. `python3 -m venv venv`
2. `source venv/bin/activate`
3. `pip install -r requirements.txt`
4. `python app.py` (and `python scanner.py` in another terminal)
5. `npm run dev`
